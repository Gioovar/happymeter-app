'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { getMexicoTodayRange } from '@/actions/processes'

/**
 * Envia un mensaje interno entre miembros del equipo o el dueño.
 */
export async function sendInternalMessage(formData: FormData) {
    const { userId: clerkUserId } = await auth()

    // We expect senderId to be provided, but if not, we try to resolve it
    const rawSenderId = formData.get('senderId') as string
    const rawReceiverId = formData.get('receiverId') as string
    const rawBranchId = formData.get('branchId') as string
    const content = formData.get('content') as string

    // Critical: Handle cases where frontend sends literal "undefined" string
    const senderId = (rawSenderId && rawSenderId !== 'undefined') ? rawSenderId : null
    const receiverId = (rawReceiverId && rawReceiverId !== 'undefined') ? rawReceiverId : null
    const branchId = (rawBranchId && rawBranchId !== 'undefined') ? rawBranchId : null

    if (!content || !receiverId || !branchId) {
        console.error('[sendInternalMessage] Missing data:', { content: !!content, receiverId, branchId })
        throw new Error('Información incompleta para enviar mensaje (IDs no resueltos)')
    }

    // Determine the actual senderId if it's the Boss (Dashboard)
    const effectiveSenderId = senderId || clerkUserId

    if (!effectiveSenderId) {
        throw new Error('No se pudo identificar al remitente')
    }

    const message = await prisma.internalMessage.create({
        data: {
            content,
            senderId: effectiveSenderId,
            receiverId,
            branchId,
            isRead: false
        }
    })

    // Create a notification for the receiver
    await prisma.internalNotification.create({
        data: {
            userId: receiverId,
            branchId,
            title: 'Nuevo Mensaje 💬',
            body: content.length > 50 ? content.substring(0, 47) + '...' : content,
            type: 'NEW_MESSAGE',
            actionUrl: `/ops/chat?with=${effectiveSenderId}`, // Redirect to chat
            isRead: false
        }
    })

    revalidatePath('/ops/chat')
    revalidatePath('/dashboard/team/chat')
    return { success: true, message }
}

/**
 * Obtiene el historial de mensajes entre dos usuarios en una sucursal.
 */
export async function getInternalMessages(branchId: string, otherUserId: string, currentUserId: string) {
    if (!branchId || !currentUserId) return []

    return await prisma.internalMessage.findMany({
        where: {
            branchId,
            OR: [
                { senderId: currentUserId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: currentUserId }
            ]
        },
        orderBy: { createdAt: 'asc' }
    })
}

/**
 * Marca todos los mensajes de una conversación como leídos.
 */
export async function markMessagesAsRead(branchId: string, senderId: string, currentUserId: string) {
    await prisma.internalMessage.updateMany({
        where: {
            branchId,
            senderId: senderId,
            receiverId: currentUserId,
            isRead: false
        },
        data: { isRead: true }
    })
    revalidatePath('/ops/chat')
}

/**
 * Obtiene las notificaciones internas del usuario actual.
 */
export async function getInternalNotifications(userId: string, branchId?: string) {
    if (!userId) return []

    return await prisma.internalNotification.findMany({
        where: {
            userId,
            ...(branchId ? { branchId } : {}),
            isRead: false
        },
        orderBy: { createdAt: 'desc' }
    })
}

/**
 * Marca una notificación como leída.
 */
export async function markInternalNotificationRead(id: string) {
    await prisma.internalNotification.update({
        where: { id },
        data: { isRead: true }
    })
    revalidatePath('/ops')
}

/**
 * Obtiene la lista de todo el personal de todas las sucursales vinculadas a las cadenas del usuario.
 */
export async function getChainStaffList() {
    const { userId } = await auth()
    if (!userId) return []

    const { start: todayStart, end: todayEnd, dayOfWeek } = await getMexicoTodayRange()

    // 1. Get all chains where user is owner
    const chains = await prisma.chain.findMany({
        where: { ownerId: userId },
        include: {
            branches: {
                include: {
                    branch: {
                        include: {
                            teamMembers: {
                                where: {
                                    isActive: true,
                                    userId: { not: userId } // Exclude myself
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    // 2. Flatten and group members by branch with stats
    const staffList: any[] = []

    for (const chain of chains) {
        for (const cb of chain.branches) {
            const branchName = cb.name || cb.branch.businessName || 'Sucursal Sin Nombre'

            // Get all tasks assigned for this branch today to calculate stats
            const branchTasks = await prisma.processTask.findMany({
                where: {
                    zone: { branchId: cb.branchId },
                    days: { has: dayOfWeek }
                }
            })

            const branchEvidences = await prisma.processEvidence.findMany({
                where: {
                    taskId: { in: branchTasks.map(t => t.id) },
                    submittedAt: { gte: todayStart, lte: todayEnd }
                }
            })

            const members = cb.branch.teamMembers.map(m => {
                // Calculate stats for this specific member
                const memberTaskIds = branchTasks.filter(t => t.assignedStaffId === m.id).map(t => t.id)

                const tasksTotal = memberTaskIds.length
                const tasksDone = branchEvidences.filter(e => memberTaskIds.includes(e.taskId)).length

                return {
                    id: m.id,
                    clerkUserId: m.userId,
                    name: m.name || 'Sin Nombre',
                    jobTitle: m.jobTitle || 'Empleado',
                    branchId: cb.branchId,
                    branchName: branchName,
                    avatarUrl: null,
                    stats: {
                        total: tasksTotal,
                        done: tasksDone,
                        compliance: tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0
                    }
                }
            })

            if (members.length > 0) {
                staffList.push({
                    branchId: cb.branchId,
                    branchName: branchName,
                    members: members
                })
            }
        }
    }

    return staffList
}

/**
 * Obtiene la lista de hilos de conversación activos para un miembro del personal.
 */
export async function getInternalChatList(memberId: string, branchId: string) {
    if (!memberId || !branchId) return []

    // 1. Get all messages where our member is sender or receiver
    const messages = await prisma.internalMessage.findMany({
        where: {
            branchId,
            OR: [
                { senderId: memberId },
                { receiverId: memberId }
            ]
        },
        orderBy: { createdAt: 'desc' }
    })

    // 2. Group by "the other person"
    const conversationMap = new Map<string, {
        otherId: string,
        lastMessage: string,
        lastDate: Date,
        unreadCount: number
    }>()

    messages.forEach((msg: any) => {
        const otherId = msg.senderId === memberId ? msg.receiverId : msg.senderId
        if (!conversationMap.has(otherId)) {
            conversationMap.set(otherId, {
                otherId,
                lastMessage: msg.content,
                lastDate: msg.createdAt,
                unreadCount: 0
            })
        }
        if (!msg.isRead && msg.receiverId === memberId) {
            const current = conversationMap.get(otherId)!
            current.unreadCount++
        }
    })

    // 3. Resolve names for the "otherId" (usually Clerk User IDs of managers)
    const otherIds = Array.from(conversationMap.keys())
    const userSettings = await prisma.userSettings.findMany({
        where: { userId: { in: otherIds } },
        select: { userId: true, businessName: true, fullName: true, photoUrl: true }
    })

    // Also check if any are other team members (though in this context it's mostly manager-staff)
    const otherTeamMembers = await prisma.teamMember.findMany({
        where: { id: { in: otherIds } },
        select: { id: true, name: true, jobTitle: true }
    })

    return Array.from(conversationMap.values()).map(conv => {
        const profile = userSettings.find(u => u.userId === conv.otherId)
        const memberProfile = otherTeamMembers.find(m => m.id === conv.otherId)

        return {
            ...conv,
            name: profile?.businessName || profile?.fullName || memberProfile?.name || 'Sistema / Soporte',
            avatar: profile?.photoUrl || null,
            jobTitle: memberProfile?.jobTitle || 'Administración'
        }
    }).sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime())
}

/**
 * Helper para crear notificaciones internas desde otros procesos.
 */
export async function createInternalNotification(
    targetUserId: string,
    branchId: string,
    title: string,
    body: string,
    type: string,
    actionUrl?: string
) {
    return await prisma.internalNotification.create({
        data: {
            userId: targetUserId,
            branchId,
            title,
            body,
            type,
            actionUrl,
            isRead: false
        }
    })
}

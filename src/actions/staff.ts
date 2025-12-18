'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function checkStaffRole() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })

    if (user?.role !== 'STAFF' && user?.role !== 'SUPER_ADMIN') {
        throw new Error('Forbidden: Staff access required')
    }

    return userId
}

export async function toggleCreatorStatus(creatorId: string, currentStatus: string) {
    await checkStaffRole()

    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'

    // If it was PENDING -> ACTIVE
    if (currentStatus === 'PENDING') {
        // Here we could trigger an "Approved" email/whatsapp
        // For now just update stats
    }

    await prisma.affiliateProfile.update({
        where: { id: creatorId },
        data: { status: newStatus === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED' }
    })

    revalidatePath('/staff/creators')
    revalidatePath('/admin/creators')
    return { success: true, newStatus }
}

export async function approveCreator(creatorId: string, commissionRate: number) {
    await checkStaffRole()

    const creator = await prisma.affiliateProfile.update({
        where: { id: creatorId },
        data: {
            status: 'ACTIVE',
            commissionRate: commissionRate
        }
    })

    // Trigger notification here if needed (e.g. WhatsApp "You are approved!")
    const { sendCreatorApprovedAlert } = await import('@/lib/alerts')
    // We assume we have this function or will add it. For now let's just log or skip.

    revalidatePath('/staff/creators')
    revalidatePath('/staff/creators')
    return { success: true }
}

export async function getStaffChats() {
    await checkStaffRole()

    const chats = await prisma.adminChat.findMany({
        include: {
            creator: {
                include: {
                    user: {
                        select: {
                            businessName: true
                        }
                    }
                }
            },
            messages: {
                orderBy: { createdAt: 'desc' },
                take: 1
            },
            _count: {
                select: {
                    messages: {
                        where: { isRead: false }
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    return chats
}

export async function getStaffChatDetails(chatId: string) {
    await checkStaffRole()

    const chat = await prisma.adminChat.findUnique({
        where: { id: chatId },
        include: {
            messages: { orderBy: { createdAt: 'asc' } },
            creator: {
                include: {
                    user: { select: { businessName: true } }
                }
            }
        }
    })

    return chat
}

export async function markChatAsRead(chatId: string) {
    await checkStaffRole()

    // Mark all messages in this chat as read
    // In a real app we might only mark "incoming" messages, but "read thread" implies all seen.
    await prisma.adminChatMessage.updateMany({
        where: {
            chatId,
            isRead: false
        },
        data: { isRead: true }
    })

    revalidatePath('/staff/chat')
    return { success: true }
}

export async function replyToChat(chatId: string, content: string, senderId: string, attachment?: { url: string, type: string }) {
    await checkStaffRole()

    if (!content.trim() && !attachment) return // Allow empty content if attachment exists

    await prisma.adminChatMessage.create({
        data: {
            chatId,
            content: content || (attachment ? (attachment.type === 'image' ? '📷 Imagen' : '📎 Archivo') : ''),
            senderId,
            isRead: true, // Staff messages are read by definition
            attachmentType: attachment?.type
        }
    })

    // Update Chat timestamp for sorting
    await prisma.adminChat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
    })

    // Update Chat timestamp for sorting
    await prisma.adminChat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
    })

    // We can also trigger an email/whatsapp to the creator saying "Support replied!"
    // Skipping for now to avoid complexity, but usually desired.

    revalidatePath('/staff/chat')
    return { success: true }
}

export async function deleteChat(chatId: string) {
    await checkStaffRole()

    await prisma.adminChat.delete({
        where: { id: chatId }
    })

    revalidatePath('/staff/chat')
    return { success: true }
}

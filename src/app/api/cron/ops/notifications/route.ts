import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, format, addMinutes, subMinutes } from 'date-fns'
import { sendNativePush } from '@/lib/push-engine'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Adjust for Timezone (Default: Mexico City -6h)
        const TIMEZONE_OFFSET_HOURS = 6
        const serverNow = new Date()
        const localNow = subMinutes(serverNow, TIMEZONE_OFFSET_HOURS * 60)

        const currentTime = format(localNow, 'HH:mm')
        const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const todayDayName = dayNamesShort[localNow.getDay()]

        // Boundaries for "Today" in UTC to check evidence and prev notifications
        const utcStart = addMinutes(startOfDay(localNow), TIMEZONE_OFFSET_HOURS * 60)
        const utcEnd = addMinutes(endOfDay(localNow), TIMEZONE_OFFSET_HOURS * 60)

        // 1. Fetch all tasks for today along with their owner settings
        const tasks = await prisma.processTask.findMany({
            where: {
                days: { has: todayDayName }
            },
            include: {
                zone: {
                    include: {
                        user: true // The business owner
                    }
                },
                assignedTo: true // The staff member
            }
        })

        let notificationsSent = 0

        for (const task of tasks) {
            if (!task.limitTime || !task.assignedStaffId || !task.assignedTo) continue

            // Check if evidence already exists for today
            const evidence = await prisma.processEvidence.findFirst({
                where: {
                    taskId: task.id,
                    submittedAt: {
                        gte: utcStart,
                        lte: utcEnd
                    }
                }
            })

            if (evidence) continue // Task already completed

            // Determine notification offset preference (default 10)
            const settings = task.zone.user.notificationPreferences as any
            const offset = settings?.opsTaskReminderOffset || 10
            
            const warningTimeTarget = format(addMinutes(localNow, offset), 'HH:mm')
            const staff = task.assignedTo
            const targetBranchId = task.zone.branchId || task.zone.userId
            const ownerId = task.zone.userId

            // --- 1. PREVENTIVE NOTIFICATION (X min before) ---
            if (task.limitTime === warningTimeTarget) {
                const alreadyNotified = await prisma.notification.findFirst({
                    where: {
                        userId: staff.id, // Using staff.id as memberId/target
                        type: 'TASK_REMINDER_SOON',
                        createdAt: { gte: utcStart },
                        message: { contains: task.title }
                    }
                })

                if (!alreadyNotified) {
                    const title = '⏰ Tarea por vencer'
                    const body = `Tienes ${offset} minutos para completar "${task.title}" y enviar evidencia.`
                    const route = `/ops/tasks/${task.id}`

                    await prisma.notification.create({ // In-app bell for staff
                        data: {
                            userId: staff.id,
                            title,
                            message: body,
                            type: 'TASK_REMINDER_SOON',
                            meta: {
                                branchId: targetBranchId,
                                url: route
                            }
                        }
                    })

                    await sendNativePush({
                        title,
                        body,
                        appType: 'OPS',
                        memberId: staff.id,
                        userId: staff.userId || undefined,
                        route
                    })
                    notificationsSent++
                }
            }

            // --- 2. REAL-TIME NOTIFICATION (Now) ---
            if (task.limitTime === currentTime) {
                const alreadyNotified = await prisma.notification.findFirst({
                    where: {
                        userId: staff.id,
                        type: 'TASK_REMINDER_NOW',
                        createdAt: { gte: utcStart },
                        message: { contains: task.title }
                    }
                })

                if (!alreadyNotified) {
                    const title = '📍 Momento de Tarea'
                    const body = `Es momento de realizar "${task.title}". Captura la evidencia ahora.`
                    const route = `/ops/tasks/${task.id}`

                    await prisma.notification.create({
                        data: {
                            userId: staff.id,
                            title,
                            message: body,
                            type: 'TASK_REMINDER_NOW',
                            meta: {
                                branchId: targetBranchId,
                                url: route
                            }
                        }
                    })

                    await sendNativePush({
                        title,
                        body,
                        appType: 'OPS',
                        memberId: staff.id,
                        userId: staff.userId || undefined,
                        route
                    })
                    notificationsSent++
                }
            }

            // --- 3. OVERDUE NOTIFICATION (Late) ---
            if (task.limitTime < currentTime) {
                const alreadyNotified = await prisma.notification.findFirst({
                    where: {
                        userId: staff.id,
                        type: 'TASK_OVERDUE',
                        createdAt: { gte: utcStart },
                        message: { contains: task.title }
                    }
                })

                if (!alreadyNotified) {
                    const title = '⚠️ Tarea Retrasada'
                    const body = `La tarea "${task.title}" está retrasada. Por favor complétala lo antes posible.`
                    const route = `/ops/tasks/${task.id}`

                    // NOTIFY STAFF
                    await prisma.notification.create({
                        data: {
                            userId: staff.id,
                            title,
                            message: body,
                            type: 'TASK_OVERDUE',
                            meta: {
                                branchId: targetBranchId,
                                url: route
                            }
                        }
                    })

                    await sendNativePush({
                        title,
                        body,
                        appType: 'OPS',
                        memberId: staff.id,
                        userId: staff.userId || undefined,
                        route
                    })

                    // NOTIFY OWNER (Dashboard Bell + Native Push if possible)
                    await prisma.notification.create({
                        data: {
                            userId: ownerId,
                            type: 'WARNING',
                            title: '⚠️ Tarea No Realizada',
                            message: `${staff.name || 'Staff'} no ha completado "${task.title}" (venció a las ${task.limitTime}).`,
                            meta: { taskId: task.id, staffId: staff.id }
                        }
                    })
                    
                    // Native push to owner
                    await sendNativePush({
                        title: '⚠️ Tarea Vencida en Sucursal',
                        body: `${staff.name || 'Staff'} no ha completado "${task.title}".`,
                        appType: 'OPS',
                        userId: ownerId
                    })

                    notificationsSent++
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            notificationsSent,
            localTime: currentTime,
            day: todayDayName
        })

    } catch (error) {
        console.error('[CRON OPS NOTIFS] Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}


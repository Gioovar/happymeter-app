import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, format, addMinutes, subMinutes } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const now = new Date()
        const currentTime = format(now, 'HH:mm')
        const tenMinutesFromNow = format(addMinutes(now, 10), 'HH:mm')

        const todayStart = startOfDay(now)
        const todayEnd = endOfDay(now)
        const todayDayName = format(now, 'EEE') // e.g. "Mon"

        console.log(`[CRON OPS NOTIFS] checking at ${currentTime}, matching with ${tenMinutesFromNow}`)

        // 1. Fetch all tasks that apply today
        const tasks = await prisma.processTask.findMany({
            where: {
                days: { has: todayDayName }
            },
            include: {
                zone: true
            }
        })

        let notificationsSent = 0

        for (const task of tasks) {
            // Check if evidence exists for today
            const evidence = await prisma.processEvidence.findFirst({
                where: {
                    taskId: task.id,
                    submittedAt: {
                        gte: todayStart,
                        lte: todayEnd
                    }
                }
            })

            if (evidence) continue // Already done

            // --- ALERT 1: 10 MINUTES BEFORE ---
            if (task.limitTime === tenMinutesFromNow) {
                // Determine target user
                const targetUserId = task.assignedStaffId
                if (targetUserId) {
                    // Check if already notified "SOON" today
                    const alreadyNotified = await prisma.internalNotification.findFirst({
                        where: {
                            userId: targetUserId,
                            type: 'TASK_REMINDER_SOON',
                            createdAt: { gte: todayStart },
                            body: { contains: task.title }
                        }
                    })

                    if (!alreadyNotified) {
                        await prisma.internalNotification.create({
                            data: {
                                userId: targetUserId,
                                branchId: task.zone.ownerId,
                                title: '⏰ Tarea por vencer (10 min)',
                                body: `La tarea "${task.title}" vence pronto. Asegúrate de capturar la evidencia a tiempo.`,
                                type: 'TASK_REMINDER_SOON',
                                actionUrl: `/ops/tasks/${task.id}`,
                                isRead: false
                            }
                        })
                        notificationsSent++
                    }
                }
            }

            // --- ALERT 2: TASK OVERDUE ---
            if (task.limitTime && task.limitTime < currentTime) {
                const targetUserId = task.assignedStaffId
                if (targetUserId) {
                    // Check if already notified "OVERDUE" today
                    const alreadyNotified = await prisma.internalNotification.findFirst({
                        where: {
                            userId: targetUserId,
                            type: 'TASK_OVERDUE',
                            createdAt: { gte: todayStart },
                            body: { contains: task.title }
                        }
                    })

                    if (!alreadyNotified) {
                        await prisma.internalNotification.create({
                            data: {
                                userId: targetUserId,
                                branchId: task.zone.ownerId,
                                title: '⚠️ Tarea No Realizada',
                                body: `La tarea "${task.title}" ha vencido sin evidencia. Por favor complétala lo antes posible.`,
                                type: 'TASK_OVERDUE',
                                actionUrl: `/ops/tasks/${task.id}`,
                                isRead: false
                            }
                        })
                        notificationsSent++
                    }
                }
            }
        }

        return NextResponse.json({ success: true, notificationsSent })

    } catch (error) {
        console.error('[CRON OPS NOTIFS] Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

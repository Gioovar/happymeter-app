import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, format, addMinutes, subMinutes } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // FIXED: Adjust for Timezone (Default: Mexico City -6h)
        // Since Vercel/Server is UTC, we subtract 6 hours to get local time for comparisons
        const TIMEZONE_OFFSET_HOURS = 6
        const serverNow = new Date()
        const localNow = subMinutes(serverNow, TIMEZONE_OFFSET_HOURS * 60)

        const currentTime = format(localNow, 'HH:mm')
        const tenMinutesFromNow = format(addMinutes(localNow, 10), 'HH:mm')

        const todayStart = startOfDay(localNow)
        // Note: For DB queries we might need UTC, but since we store dates in UTC
        // and compare strictly by time strings stored in DB (e.g. "14:00"), 
        // the querying logic mainly relies on `days` array and `limitTime` string matching.
        // However, `submittedAt` check needs careful handling. 
        // If `submittedAt` is stored as UTC, `todayStart` (Local start converted to Date object) might differ.
        // Ideally we compare against the UTC window corresponding to Local Today.
        // BUT `startOfDay(localNow)` returns a Date object representing 00:00 LOCAL time.
        // If we pass this to Prisma, it might be interpreted as UTC or Local depending on config.
        // Let's rely on the fact that `submittedAt` is a timestamp.
        // We want to check if submission happened "Today (Local)".

        // Let's just use the server time window for simplicity unless strictly required, 
        // OR better: define the window in UTC that corresponds to "Today in Mexico".
        // Today 00:00 Mexico = Today 06:00 UTC. 
        // Today 23:59 Mexico = NextDay 05:59 UTC.

        const utcStart = addMinutes(startOfDay(localNow), TIMEZONE_OFFSET_HOURS * 60)
        const utcEnd = addMinutes(endOfDay(localNow), TIMEZONE_OFFSET_HOURS * 60)

        const todayDayName = format(localNow, 'EEE') // e.g. "Mon" based on Local Time

        console.log(`[CRON OPS NOTIFS] Local Time: ${currentTime}, Model Time: ${tenMinutesFromNow} (Day: ${todayDayName})`)

        // 1. Fetch all tasks that apply for this "Local Day"
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
            // Check if evidence exists for "Today (Local Window)"
            const evidence = await prisma.processEvidence.findFirst({
                where: {
                    taskId: task.id,
                    submittedAt: {
                        gte: utcStart,
                        lte: utcEnd
                    }
                }
            })

            if (evidence) continue // Already done

            // --- ALERT 1: 10 MINUTES BEFORE ---
            if (task.limitTime === tenMinutesFromNow) {
                // Determine target user
                const targetUserId = task.assignedStaffId
                if (targetUserId) {
                    // Check if already notified "SOON" today (in local window)
                    const alreadyNotified = await prisma.internalNotification.findFirst({
                        where: {
                            userId: targetUserId,
                            type: 'TASK_REMINDER_SOON',
                            createdAt: { gte: utcStart },
                            body: { contains: task.title }
                        }
                    })

                    if (!alreadyNotified) {
                        // FIXED: Use correct branch ID from Zone
                        // If zone has specific branchId, use it. Otherwise fall back to owner's "main" branch (which might be null or ownerId)
                        // But strictly `branchId` field in Notification is for routing.
                        // If Zone is Global (owner level), `branchId` might be null in Zone.
                        // However, InternalNotification usually needs a context. 
                        // If it's a global task, maybe we send `null` or `ownerId`?
                        // Let's use `task.zone.branchId` if strictly available, else `task.zone.ownerId` 
                        // (Assuming ownerId acts as default branch ID for main HQ)

                        const targetBranchId = task.zone.branchId || task.zone.userId

                        await prisma.internalNotification.create({
                            data: {
                                userId: targetUserId,
                                branchId: targetBranchId,
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
                            createdAt: { gte: utcStart },
                            body: { contains: task.title }
                        }
                    })

                    if (!alreadyNotified) {
                        const targetBranchId = task.zone.branchId || task.zone.userId

                        await prisma.internalNotification.create({
                            data: {
                                userId: targetUserId,
                                branchId: targetBranchId,
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

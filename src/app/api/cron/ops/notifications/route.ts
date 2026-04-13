import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, format, addMinutes, subMinutes } from 'date-fns'
import { sendPushNotification } from '@/lib/push-service'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Adjust for Timezone (Default: Mexico City -6h)
        const TIMEZONE_OFFSET_HOURS = 6
        const serverNow = new Date()
        const localNow = subMinutes(serverNow, TIMEZONE_OFFSET_HOURS * 60)

        const currentTime = format(localNow, 'HH:mm')
        const todayDayName = format(localNow, 'EEE')

        // Boundaries for "Today" in UTC to check evidence and prev notifications
        const utcStart = addMinutes(startOfDay(localNow), TIMEZONE_OFFSET_HOURS * 60)
        const utcEnd = addMinutes(endOfDay(localNow), TIMEZONE_OFFSET_HOURS * 60)

        // 1. Fetch all tasks for today along with their owner settings
        // We include zone and zone.user (the business owner) to get notification preferences
        const tasks = await prisma.processTask.findMany({
            where: {
                days: { has: todayDayName }
            },
            include: {
                zone: {
                    include: {
                        user: true // UserSettings
                    }
                }
            }
        })

        let notificationsSent = 0

        for (const task of tasks) {
            if (!task.limitTime || !task.assignedStaffId) continue

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
            const targetUserId = task.assignedStaffId as string
            const targetBranchId = task.zone.branchId || task.zone.userId

            // --- TRACE LOG ---
            // console.log(`[CRON] Task: ${task.title}, Limit: ${task.limitTime}, Current: ${currentTime}, Target Warning: ${warningTimeTarget}`)

            // --- 1. PREVENTIVE NOTIFICATION (X min before) ---
            if (task.limitTime === warningTimeTarget) {
                const alreadyNotified = await prisma.notification.findFirst({
                    where: {
                        userId: targetUserId,
                        type: 'TASK_REMINDER_SOON',
                        createdAt: { gte: utcStart },
                        message: { contains: task.title }
                    }
                })

                if (!alreadyNotified) {
                    const title = '⏰ Tarea por vencer'
                    const body = `Tienes ${offset} minutos para completar "${task.title}" y enviar evidencia.`
                    const url = `/ops/tasks/${task.id}`

                    await prisma.notification.create({
                        data: {
                            userId: targetUserId,
                            title,
                            message: body,
                            type: 'TASK_REMINDER_SOON',
                            meta: {
                                branchId: targetBranchId,
                                url: url
                            }
                        }
                    })

                    await sendPushNotification(targetUserId, { title, body, url })
                    notificationsSent++
                }
            }

            // --- 2. REAL-TIME NOTIFICATION (Now) ---
            if (task.limitTime === currentTime) {
                const alreadyNotified = await prisma.notification.findFirst({
                    where: {
                        userId: targetUserId,
                        type: 'TASK_REMINDER_NOW',
                        createdAt: { gte: utcStart },
                        message: { contains: task.title }
                    }
                })

                if (!alreadyNotified) {
                    const title = '📍 Momento de Tarea'
                    const body = `Es momento de realizar "${task.title}". Captura la evidencia ahora.`
                    const url = `/ops/tasks/${task.id}`

                    await prisma.notification.create({
                        data: {
                            userId: targetUserId,
                            title,
                            message: body,
                            type: 'TASK_REMINDER_NOW',
                            meta: {
                                branchId: targetBranchId,
                                url: url
                            }
                        }
                    })

                    await sendPushNotification(targetUserId, { title, body, url })
                    notificationsSent++
                }
            }

            // --- 3. OVERDUE NOTIFICATION (Late) ---
            if (task.limitTime < currentTime) {
                const alreadyNotified = await prisma.notification.findFirst({
                    where: {
                        userId: targetUserId,
                        type: 'TASK_OVERDUE',
                        createdAt: { gte: utcStart },
                        message: { contains: task.title }
                    }
                })

                if (!alreadyNotified) {
                    const title = '⚠️ Tarea Retrasada'
                    const body = `La tarea "${task.title}" está retrasada. Por favor complétala lo antes posible.`
                    const url = `/ops/tasks/${task.id}`

                    await prisma.notification.create({
                        data: {
                            userId: targetUserId,
                            title,
                            message: body,
                            type: 'TASK_OVERDUE',
                            meta: {
                                branchId: targetBranchId,
                                url: url
                            }
                        }
                    })

                    await sendPushNotification(targetUserId, { title, body, url })
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


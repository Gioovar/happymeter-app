import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export const dynamic = 'force-dynamic' // Ensure it runs dynamically

export async function GET(req: Request) {
    try {
        const now = new Date()
        // Default to UTC-6 (Mexico City) for "Local Time" logic if no timezone provided
        // In real app, store timezone per branch. Here we assume generic -6 offset for simplicity or UTC
        // Vercel runs in UTC. Let's assume limitTime strings are in local time, so we need to shift UTC to Local.
        // Quick hack: Get current hour in "User's Time". Let's assume -6 for now (CDMX).
        const localHour = (now.getUTCHours() - 6 + 24) % 24
        const localMinutes = now.getUTCMinutes()
        const currentTimeString = `${localHour.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`

        console.log(`[CRON TASKS] checking at ${currentTimeString} (Local Approx)`)

        // 1. Fetch active branches (Users with ProcessZones)
        const branches = await prisma.user.findMany({
            where: {
                processZones: { some: {} } // Only those with zones
            },
            include: {
                processZones: {
                    include: {
                        tasks: true
                    }
                },
                branchOf: {
                    include: {
                        chain: true
                    }
                }
            }
        })

        const todayStart = startOfDay(now)
        const todayEnd = endOfDay(now)

        let notificationsSent = 0

        for (const branch of branches) {
            let overdueCount = 0
            let totalTasksCount = 0

            // Collect all tasks for this branch
            for (const zone of branch.processZones) {
                for (const task of zone.tasks) {
                    totalTasksCount++

                    // Check if task has evidence for today
                    const evidence = await prisma.processEvidence.findFirst({
                        where: {
                            taskId: task.id,
                            submittedAt: {
                                gte: todayStart,
                                lte: todayEnd
                            }
                        }
                    })

                    if (!evidence) {
                        // If task has a limit time and it passed...
                        if (task.limitTime && task.limitTime < currentTimeString) {
                            overdueCount++
                        }
                    }
                }
            }

            // --- ALERT 1: HOURLY BRANCH MANAGER ALERT ---
            // If > 2 tasks are overdue right now
            if (overdueCount > 2) {
                // Check if we already alerted today to avoid spamming every hour
                // We'll allow alerting again if count increased? Or just once a day?
                // User said "Cada hora... Si hay mas de 2". If we alert at 10am, and at 11am still >2, do we alert again?
                // Probably annoying. Let's limit to one "CRISIS" alert per day for tasks, or maybe one for "Morning" one for "Afternoon".
                // For safety, let's check if we sent a 'CRISIS' alert about TASKS in the last 4 hours.
                const recentAlert = await prisma.notification.findFirst({
                    where: {
                        userId: branch.id,
                        type: 'CRISIS',
                        title: { contains: '⚠️ Tareas Vencidas' },
                        createdAt: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) }
                    }
                })

                if (!recentAlert) {
                    await prisma.notification.create({
                        data: {
                            userId: branch.id,
                            type: 'CRISIS',
                            title: '⚠️ Tareas Vencidas Críticas',
                            message: `Atención: Tienes ${overdueCount} tareas operativas vencidas sin evidencia hoy. Revisa tu panel de Procesos inmediatamente.`,
                            meta: { branchId: branch.id }
                        }
                    })
                    notificationsSent++
                }
            }

            // --- ALERT 2: DAILY CHAIN OWNER ALERT ---
            // Run this only near end of day (e.g., 22:00 local time)
            if (localHour === 22) { // 10 PM
                const uncompletedTotal = overdueCount // At 10PM, basically everything overdue is uncompleted for the day

                if (uncompletedTotal > 2) {
                    // Find Chain Owner
                    // A branch might belong to a chain
                    const chainBranch = branch.branchOf[0] // Assuming primary chain
                    if (chainBranch && chainBranch.chain) {
                        const ownerId = chainBranch.chain.ownerId

                        // Check if we already alerted owner today about this branch
                        const alreadyAlertedOwner = await prisma.notification.findFirst({
                            where: {
                                userId: ownerId,
                                type: 'REPORT',
                                message: { contains: branch.businessName || 'Sucursal' },
                                createdAt: { gte: todayStart }
                            }
                        })

                        if (!alreadyAlertedOwner) {
                            await prisma.notification.create({
                                data: {
                                    userId: ownerId,
                                    type: 'REPORT',
                                    title: '📊 Incumplimiento Diario de Procesos',
                                    message: `Resumen Diario: La sucursal '${branch.businessName || 'Sin Nombre'}' terminó el día con ${uncompletedTotal} tareas incumplidas.`,
                                    meta: { branchId: branch.id } // Tag with branch so it shows nicely in Chain View
                                }
                            })
                            notificationsSent++
                        }
                    }
                }
            }
        }

        return NextResponse.json({ success: true, notificationsSent })

    } catch (error) {
        console.error('[CRON TASKS] Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

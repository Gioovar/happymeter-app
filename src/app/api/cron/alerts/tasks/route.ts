import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export const dynamic = 'force-dynamic' // Ensure it runs dynamically

export async function GET(req: Request) {
    try {
        const now = new Date()
        const localHour = (now.getUTCHours() - 6 + 24) % 24
        const localMinutes = now.getUTCMinutes()
        const currentTimeString = `${localHour.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}`

        console.log(`[CRON TASKS] checking at ${currentTimeString} (Local Approx)`)

        const zones = await prisma.processZone.findMany({
            include: {
                tasks: true
            }
        })

        const branchesMap: Record<string, typeof zones> = {}
        for (const zone of zones) {
            if (!branchesMap[zone.userId]) branchesMap[zone.userId] = []
            branchesMap[zone.userId].push(zone)
        }

        const todayStart = startOfDay(now)
        const todayEnd = endOfDay(now)

        let notificationsSent = 0

        for (const [userId, processZones] of Object.entries(branchesMap)) {
            let overdueCount = 0
            let totalTasksCount = 0

            for (const zone of processZones) {
                for (const task of zone.tasks) {
                    totalTasksCount++

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
                        if (task.limitTime && task.limitTime < currentTimeString) {
                            overdueCount++
                        }
                    }
                }
            }

            if (overdueCount > 2) {
                const recentAlert = await prisma.notification.findFirst({
                    where: {
                        userId: userId,
                        type: 'CRISIS',
                        title: { contains: '⚠️ Tareas Vencidas' },
                        createdAt: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) }
                    }
                })

                if (!recentAlert) {
                    await prisma.notification.create({
                        data: {
                            userId: userId,
                            type: 'CRISIS',
                            title: '⚠️ Tareas Vencidas Críticas',
                            message: `Atención: Tienes ${overdueCount} tareas operativas vencidas sin evidencia hoy. Revisa tu panel de Procesos inmediatamente.`,
                            meta: { branchId: userId }
                        }
                    })
                    notificationsSent++
                }
            }

            if (localHour === 22) { 
                const uncompletedTotal = overdueCount

                if (uncompletedTotal > 2) {
                    const chainBranch = await prisma.chainBranch.findFirst({
                        where: { branchId: userId }
                    });

                    if (chainBranch) {
                        const chain = await prisma.chain.findUnique({ where: { id: chainBranch.chainId } });
                        if (chain) {
                            const ownerId = chain.ownerId
                            const businessName = chainBranch.name || 'Sucursal'

                            const alreadyAlertedOwner = await prisma.notification.findFirst({
                                where: {
                                    userId: ownerId,
                                    type: 'REPORT',
                                    message: { contains: businessName },
                                    createdAt: { gte: todayStart }
                                }
                            })

                            if (!alreadyAlertedOwner) {
                                await prisma.notification.create({
                                    data: {
                                        userId: ownerId,
                                        type: 'REPORT',
                                        title: '📊 Incumplimiento Diario de Procesos',
                                        message: `Resumen Diario: La sucursal '${businessName}' terminó el día con ${uncompletedTotal} tareas incumplidas.`,
                                        meta: { branchId: userId }
                                    }
                                })
                                notificationsSent++
                            }
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

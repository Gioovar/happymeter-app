import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export async function GET(req: Request) {
    try {
        // Authenticate Cron Request (Optional but recommended)
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //   return new NextResponse('Unauthorized', { status: 401 });
        // }

        console.log('[CRON] Starting Daily Alerts Check...')

        // 1. Get all active branches (users with surveys)
        const users = await prisma.user.findMany({
            include: {
                surveys: true
            }
        })

        const yesterday = subDays(new Date(), 1)
        const lastWeek = subDays(new Date(), 7)
        const twoWeeksAgo = subDays(new Date(), 14)

        for (const user of users) {
            // Skip users without surveys
            if (user.surveys.length === 0) continue

            // --- A. INACTIVITY CHECK ---
            // Check if ANY survey has received a response in the last 24h
            const recentResponseCount = await prisma.response.count({
                where: {
                    survey: { userId: user.id },
                    createdAt: { gte: yesterday }
                }
            })

            if (recentResponseCount === 0) {
                // Check if we already alerted today
                const alreadyAlerted = await prisma.notification.findFirst({
                    where: {
                        userId: user.id,
                        type: 'SYSTEM',
                        title: { contains: '📉 Alerta de Inactividad' },
                        createdAt: { gte: yesterday }
                    }
                })

                if (!alreadyAlerted) {
                    await prisma.notification.create({
                        data: {
                            userId: user.id,
                            type: 'SYSTEM',
                            title: '📉 Alerta de Inactividad (24h)',
                            message: 'No hemos recibido ninguna encuesta en las últimas 24 horas. Verifica que los códigos QR estén visibles o que el staff esté solicitando feedback.',
                            meta: { branchId: user.id }
                        }
                    })
                }
            }

            // --- B. NPS DROP CHECK ---
            // Calculate NPS for current week vs previous week
            // Simplified NPS calc logic here or reuse a service if available
            // For cron efficiency, we'll do a rough check on average rating as proxy if NPS is too heavy,
            // but let's try NPS if possible or just Average Rating Drop which is faster.

            // Let's go with Average Rating for speed in this iteration
            const currentWeekAvg = await prisma.response.aggregate({
                where: {
                    survey: { userId: user.id },
                    createdAt: { gte: lastWeek }
                },
                _avg: { rating: true }
            })

            const previousWeekAvg = await prisma.response.aggregate({
                where: {
                    survey: { userId: user.id },
                    createdAt: { gte: twoWeeksAgo, lt: lastWeek }
                },
                _avg: { rating: true }
            })

            const curr = currentWeekAvg._avg.rating || 0
            const prev = previousWeekAvg._avg.rating || 0

            // If we have enough data (at least some responses) and drop is significant (> 1.0 stars)
            if (prev > 0 && (prev - curr) >= 1.0) {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        type: 'CRISIS', // Treat as crisis or INFO
                        title: '📉 Caída Crítica de Satisfacción',
                        message: `Tu calificación promedio semanal ha caído de ${prev.toFixed(1)} a ${curr.toFixed(1)}. Revisa los comentarios recientes.`,
                        meta: { branchId: user.id }
                    }
                })
            }
        }

        return NextResponse.json({ success: true, message: 'Daily alerts processed' })

    } catch (error) {
        console.error('[CRON] Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

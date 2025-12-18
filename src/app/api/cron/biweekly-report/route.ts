
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays } from 'date-fns'

export async function GET(req: Request) {
    try {
        console.log('[CRON] Starting Bi-Weekly Report Generation...')

        const fifteenDaysAgo = subDays(new Date(), 15)

        // 1. Get surveys with activity in the last 15 days
        // Since there is no User model relation, we fetch surveys directly
        const surveysWithActivity = await prisma.survey.findMany({
            where: {
                responses: {
                    some: {
                        createdAt: {
                            gte: fifteenDaysAgo
                        }
                    }
                }
            },
            include: {
                responses: {
                    where: {
                        createdAt: {
                            gte: fifteenDaysAgo
                        }
                    },
                    include: {
                        answers: {
                            include: {
                                question: true
                            }
                        }
                    }
                }
            }
        })

        console.log(`[CRON] Found ${surveysWithActivity.length} active surveys.`)

        // 2. Group by User ID
        const userStats: Record<string, { totalResponses: number, totalNpsResponses: number, promoters: number, detractors: number }> = {}

        for (const survey of surveysWithActivity) {
            const userId = survey.userId
            if (!userStats[userId]) {
                userStats[userId] = { totalResponses: 0, totalNpsResponses: 0, promoters: 0, detractors: 0 }
            }

            userStats[userId].totalResponses += survey.responses.length

            for (const response of survey.responses) {
                const ratingAnswer = response.answers.find(a =>
                    a.question.type === 'RATING' || a.question.type === 'EMOJI' || a.question.type === 'NPS'
                )

                if (ratingAnswer) {
                    const val = parseInt(ratingAnswer.value)

                    let isPromoter = false
                    let isDetractor = false

                    if (ratingAnswer.question.type === 'NPS' || parseInt(ratingAnswer.value) > 5) {
                        // 0-10 scale
                        if (val >= 9) isPromoter = true
                        if (val <= 6) isDetractor = true
                    } else {
                        // 1-5 scale
                        if (val === 5) isPromoter = true
                        if (val <= 3) isDetractor = true
                    }

                    userStats[userId].totalNpsResponses++
                    if (isPromoter) userStats[userId].promoters++
                    if (isDetractor) userStats[userId].detractors++
                }
            }
        }

        // 3. Generate Notifications
        let reportsGenerated = 0
        const userIds = Object.keys(userStats)

        for (const userId of userIds) {
            const stats = userStats[userId]
            if (stats.totalResponses > 0) {
                const npsScore = stats.totalNpsResponses > 0
                    ? Math.round(((stats.promoters - stats.detractors) / stats.totalNpsResponses) * 100)
                    : 0

                await prisma.notification.create({
                    data: {
                        userId: userId,
                        type: 'REPORT',
                        title: '📈 Resumen Quincenal',
                        message: `En los últimos 15 días has recibido ${stats.totalResponses} nuevas respuestas.\nTu NPS calculado es: ${npsScore}.\n¡Sigue así!`,
                        meta: { type: 'biweekly_report', date: new Date().toISOString() }
                    }
                })
                reportsGenerated++
            }
        }

        return NextResponse.json({ success: true, reportsGenerated })

    } catch (error) {
        console.error('[CRON_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

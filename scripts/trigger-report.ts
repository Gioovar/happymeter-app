
import { PrismaClient } from '@prisma/client'
import { subDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Simulating Bi-Weekly Report Cron ---')

    const fifteenDaysAgo = subDays(new Date(), 15)
    console.log(`Checking responses since: ${fifteenDaysAgo.toISOString()}`)

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

    console.log(`Found ${surveysWithActivity.length} active surveys.`)

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

    // 3. Generate Notifications (Simulated)
    const userIds = Object.keys(userStats)

    for (const userId of userIds) {
        console.log(`Processing User: ${userId}`)
        const stats = userStats[userId]

        if (stats.totalResponses > 0) {
            const npsScore = stats.totalNpsResponses > 0
                ? Math.round(((stats.promoters - stats.detractors) / stats.totalNpsResponses) * 100)
                : 0

            console.log(`Calculated NPS: ${npsScore} (Responses: ${stats.totalResponses})`)
            console.log('Creating REPORT notification...')

            await prisma.notification.create({
                data: {
                    userId: userId,
                    type: 'REPORT',
                    title: '📈 Resumen Quincenal (Simulado)',
                    message: `En los últimos 15 días has recibido ${stats.totalResponses} nuevas respuestas.\nTu NPS calculado es: ${npsScore}.\n¡Sigue así!`,
                    meta: { type: 'biweekly_report', date: new Date().toISOString() }
                }
            })
            console.log('Notification Created!')
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

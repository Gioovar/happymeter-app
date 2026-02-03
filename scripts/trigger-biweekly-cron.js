
const { PrismaClient } = require('@prisma/client')
const { subDays, startOfDay, endOfDay } = require('date-fns')

const prisma = new PrismaClient()

async function triggerBiWeeklyReport() {
    try {
        console.log('🚀 Triggering Bi-Weekly Report...')
        const today = new Date()

        // Skip date check for testing purposes
        const fifteenDaysAgo = subDays(new Date(), 15)

        // 1. Get surveys with activity in the last 15 days
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

        let reportsGenerated = 0

        for (const survey of surveysWithActivity) {
            // Force send to Main User for Testing purposes
            const userId = 'user_37SspAObOBtCtERjB21CReDLSdb'
            // const userId = survey.userId

            // Calculate Stats for this specific survey
            let totalResponses = survey.responses.length
            let totalNpsResponses = 0
            let promoters = 0
            let detractors = 0

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

                    totalNpsResponses++
                    if (isPromoter) promoters++
                    if (isDetractor) detractors++
                }
            }

            if (totalResponses > 0) {
                // Remove Idempotency Check for Testing so it ALWAYS generates
                const title = `📈 Resumen Quincenal (${survey.title})`

                const npsScore = totalNpsResponses > 0
                    ? Math.round(((promoters - detractors) / totalNpsResponses) * 100)
                    : 0

                console.log(`Creating notification for Survey: ${survey.title} (ID: ${survey.id})`)

                await prisma.notification.create({
                    data: {
                        userId: userId,
                        type: 'REPORT',
                        title: title,
                        message: `En los últimos 15 días, "${survey.title}" recibió ${totalResponses} nuevas respuestas.\nEl NPS calculado es: ${npsScore}.\n¡Revisa los detalles!`,
                        meta: {
                            type: 'biweekly_report',
                            date: new Date().toISOString(),
                            surveyId: survey.id
                        }
                    }
                })
                reportsGenerated++
            }
        }

        console.log(`✅ Generated ${reportsGenerated} reports.`)

    } catch (e) {
        console.error('❌ Error generating reports:', e)
    } finally {
        await prisma.$disconnect()
    }
}

triggerBiWeeklyReport()

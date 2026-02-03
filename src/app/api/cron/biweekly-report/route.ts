
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(req: Request) {
    try {
        const today = new Date()
        const dayOfMonth = today.getDate()

        // 0. Schedule Check: Only run on the 3rd and 18th of the month
        if (dayOfMonth !== 3 && dayOfMonth !== 18) {
            console.log(`[CRON] Skipping Bi-Weekly Report: Today is day ${dayOfMonth}, waiting for 3rd or 18th.`)
            return NextResponse.json({ skipped: true, reason: `Not schedule day (Today: ${dayOfMonth}). Expecting 3 or 18.` })
        }

        console.log('[CRON] Starting Bi-Weekly Report Generation...')

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

        // 2. Generate Notifications Per Survey
        let reportsGenerated = 0

        for (const survey of surveysWithActivity) {
            const userId = survey.userId

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
                // Idempotency Check: Prevent duplicate reports for exact same survey/day
                const title = `📈 Resumen Quincenal (${survey.title})`

                const alreadySent = await prisma.notification.findFirst({
                    where: {
                        userId: userId,
                        type: 'REPORT',
                        title: title,
                        createdAt: {
                            gte: startOfDay(today),
                            lte: endOfDay(today)
                        }
                    }
                })

                if (alreadySent) {
                    console.log(`[CRON] Report already sent for ${survey.title} today. Skipping.`)
                    continue
                }

                const npsScore = totalNpsResponses > 0
                    ? Math.round(((promoters - detractors) / totalNpsResponses) * 100)
                    : 0

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

        return NextResponse.json({ success: true, reportsGenerated })

    } catch (error) {
        console.error('[CRON_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

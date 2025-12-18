
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Simulating Analytics API Logic ---')

    // 1. Get User ID (Assuming the first user for now, or finding one with surveys)
    const user = await prisma.userSettings.findFirst()
    if (!user) {
        console.log('No user found.')
        return
    }
    const userId = user.userId
    console.log(`Using UserId: ${userId}`)

    // 2. Mock Request Logic
    const whereClause: any = { survey: { userId } }

    // 3. Bulk Stats
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const bulkStatsResponses = await prisma.response.findMany({
        where: {
            ...whereClause,
            createdAt: { gte: thirtyDaysAgo }
        },
        select: {
            id: true,
            createdAt: true,
            surveyId: true,
            answers: {
                where: {
                    question: {
                        type: { in: ['RATING', 'EMOJI', 'TEXT'] }
                    }
                },
                select: {
                    value: true,
                    questionId: true,
                    question: { select: { type: true, text: true } }
                }
            }
        }
    })

    console.log(`Responses found (Last 30 Days): ${bulkStatsResponses.length}`)

    // 4. Processing Logic
    let totalRatingSum = 0
    let totalRatingCount = 0
    let promoters = 0
    let detractors = 0

    const debugLogs: any[] = []

    bulkStatsResponses.forEach(r => {
        const ratingAnswers = r.answers.filter(a => a.question.type === 'RATING' || a.question.type === 'EMOJI')
        const ratingAns = ratingAnswers[0]

        if (ratingAns) {
            const val = parseInt(ratingAns.value)
            if (!isNaN(val)) {
                totalRatingSum += val
                totalRatingCount++

                let type = 'Passive'
                if (val === 5) { promoters++; type = 'Promoter' }
                else if (val <= 3) { detractors++; type = 'Detractor' }

                debugLogs.push({ id: r.id, val, type })
            } else {
                debugLogs.push({ id: r.id, val: ratingAns.value, type: 'NaN' })
            }
        } else {
            // console.log(`Response ${r.id} has no rating answer selected`)
        }
    })

    console.log('--- Debug Details (First 10) ---')
    console.table(debugLogs.slice(0, 10))

    console.log('--- Summary ---')
    console.log(`Total Rating Count: ${totalRatingCount}`)
    console.log(`Promoters: ${promoters}`)
    console.log(`Detractors: ${detractors}`)

    const totalNpsResponses = promoters + detractors + (totalRatingCount - promoters - detractors) // == totalRatingCount
    const npsScore = totalNpsResponses > 0 ? Math.round(((promoters - detractors) / totalNpsResponses) * 100) : 0

    console.log(`NPS Calculation: (${promoters} - ${detractors}) / ${totalNpsResponses} * 100 = ${npsScore}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

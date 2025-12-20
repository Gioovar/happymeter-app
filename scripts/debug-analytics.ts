
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fetching recent responses...')

    // 2. Bulk Stats Data Logic (Mimicking route.ts)
    console.log('Fetching bulk stats...')
    const bulkStatsResponses = await prisma.response.findMany({
        where: {}, // All time
        select: {
            id: true,
            createdAt: true,
            surveyId: true,
            customerSource: true,
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
    console.log(`Found ${bulkStatsResponses.length} bulk responses.`)

    const sourceStats: Record<string, number> = {}
    let promoters = 0
    let detractors = 0
    let totalRatingCount = 0
    let sentimentStats = { positive: 0, neutral: 0, negative: 0 }

    bulkStatsResponses.forEach(r => {
        const ratingAnswers = r.answers.filter(a => a.question?.type === 'RATING' || a.question?.type === 'EMOJI')
        const ratingAns = ratingAnswers[0]

        if (ratingAns) {
            const val = parseInt(ratingAns.value)
            if (!isNaN(val)) {
                totalRatingCount++
                if (val === 5) promoters++
                else if (val <= 3) detractors++

                if (val >= 4) sentimentStats.positive++
                else if (val === 3) sentimentStats.neutral++
                else sentimentStats.negative++
            }
        }

        // Source Stats Check (Potential crash point if customerSource is missing from DB schema/types)
        // Note: Prisma types should be up to date if `npx prisma generate` ran.
        // But if DB column is missing, `findMany` might fail or return null.
        const src = r.customerSource || 'No especificado'
        if (src) {
            const cleanSrc = src.trim()
            sourceStats[cleanSrc] = (sourceStats[cleanSrc] || 0) + 1
        }
    })

    console.log('Source Stats:', sourceStats)
    console.log('Sentiment Stats:', sentimentStats)
    console.log('Promoters:', promoters)
    console.log('Detractors:', detractors)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

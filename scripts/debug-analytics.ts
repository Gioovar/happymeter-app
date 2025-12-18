
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fetching recent responses...')

    // Fetch last 5 responses similar to the analytics route
    const recentRaw = await prisma.response.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            survey: { select: { title: true, questions: true } },
            answers: { include: { question: true } }
        }
    })

    console.log(`Found ${recentRaw.length} responses.`)

    recentRaw.forEach((r, i) => {
        console.log(`\n--- Response ${i + 1} (${r.customerName || 'Anon'}) ---`)
        console.log(`ID: ${r.id}`)
        console.log(`Date: ${r.createdAt}`)

        const answers = r.answers || []
        console.log(`Answers count: ${answers.length}`)

        answers.forEach((a: any, j) => {
            const q = a.question
            console.log(`  [Answer ${j}] Q: "${q?.text}" Type: "${q?.type}" Value: "${a.value}" Q_ID: ${a.questionId}`)

            const isRating = q?.type === 'RATING' || q?.type === 'EMOJI'
            console.log(`    -> Is Rating? ${isRating} (Parsed: ${isRating ? parseInt(a.value) : 'N/A'})`)
        })
    })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })


import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking for rating answers...')

    const ratings = await prisma.answer.findMany({
        where: {
            question: {
                type: { in: ['RATING', 'EMOJI'] }
            }
        },
        include: { question: true, response: true }
    })

    console.log(`Found ${ratings.length} rating answers.`)

    // Show dates
    console.log('Dates of ratings:', ratings.map(r => r.response.createdAt.toISOString().split('T')[0]))

    // Group by value
    const counts: Record<string, number> = {}
    ratings.forEach(r => {
        counts[r.value] = (counts[r.value] || 0) + 1
    })

    console.log('Distribution:', counts)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

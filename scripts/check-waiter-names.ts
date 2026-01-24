
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking for answers containing waiter names...')

    // Find questions related to "mesero"
    const questions = await prisma.question.findMany({
        where: {
            text: {
                contains: 'mesero',
                mode: 'insensitive'
            }
        },
        include: {
            answers: true
        }
    })

    console.log(`Found ${questions.length} "mesero" related questions.`)

    for (const q of questions) {
        console.log(`\nQuestion: "${q.text}" (ID: ${q.id})`)
        console.log(`Total Answers: ${q.answers.length}`)

        // Show some samples
        const samples = q.answers.slice(0, 10).map(a => a.value)
        console.log('Sample values:', samples)

        // Check if any value looks like "Sí" plus extra text
        const hasExtraText = q.answers.filter(a => a.value.length > 3 && a.value.includes('Sí'))
        if (hasExtraText.length > 0) {
            console.log(`Found ${hasExtraText.length} answers with potential names attached (e.g. "Sí, Juan").`)
            console.log('Examples:', hasExtraText.slice(0, 3).map(a => a.value))
        } else {
            console.log('No answers with extra text found (only "Sí", "No", etc.).')
        }
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

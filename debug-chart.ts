
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Fetching recent responses...')

    const responses = await prisma.response.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
            answers: {
                include: {
                    question: true
                }
            },
            survey: true
        }
    })

    console.log(`Found ${responses.length} responses.`)

    responses.forEach((r: any) => {
        console.log(`\nResponse ID: ${r.id}`)
        console.log(`Date: ${r.createdAt}`)
        console.log(`Survey User: ${r.survey.userId}`)
        r.answers.forEach((a: any) => {
            console.log(` - Q: "${a.question.text}" Type: [${a.question.type}] Value: [${a.value}]`)
        })
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })

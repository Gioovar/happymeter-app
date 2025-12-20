
import { prisma } from '../src/lib/prisma.ts'

async function main() {
    const lastResponse = await prisma.response.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            answers: {
                include: {
                    question: true
                }
            }
        }
    })

    console.log('Last Response ID:', lastResponse?.id)
    console.log('Created At:', lastResponse?.createdAt)
    console.log('Answers:')
    lastResponse?.answers.forEach(a => {
        console.log(`- Q: "${a.question.text}" (Type: ${a.question.type}) -> A: "${a.value}"`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

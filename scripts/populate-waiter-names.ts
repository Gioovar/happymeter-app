
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Populating waiter names for testing...')

    const names = ['Juan', 'Pedro', 'Maria', 'Luis', 'Ana', 'Carlos', 'Sofia']

    // Find "Sí" answers for the waiter question
    const answers = await prisma.answer.findMany({
        where: {
            value: 'Sí',
            question: {
                text: { contains: 'mesero', mode: 'insensitive' }
            }
        }
    })

    console.log(`Found ${answers.length} empty "Sí" answers. Updating with fake names...`)

    for (const answer of answers) {
        const randomName = names[Math.floor(Math.random() * names.length)]
        await prisma.answer.update({
            where: { id: answer.id },
            data: { value: `Sí - ${randomName}` }
        })
    }

    console.log('Done!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

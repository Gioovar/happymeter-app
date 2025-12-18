import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const surveys = await prisma.survey.findMany({
            select: {
                id: true,
                title: true,
                userId: true,
                createdAt: true
            }
        })

        console.log(`Found ${surveys.length} surveys:`)
        surveys.forEach(s => {
            console.log(`- [${s.title}] (ID: ${s.id}) - User: ${s.userId}`)
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()

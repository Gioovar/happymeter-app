const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Connecting to database...')
        const surveys = await prisma.survey.findMany({
            select: { id: true, title: true, userId: true }
        })
        console.log(`Found ${surveys.length} surveys:`)
        surveys.forEach((s: any) => console.log(`- [${s.title}] Owner: ${s.userId}`))

        const users = await prisma.userSettings.findMany()
        console.log(`Found ${users.length} users:`)
        users.forEach((u: any) => console.log(`- User: ${u.userId}, Plan: ${u.plan}`))

    } catch (e) {
        console.error('Database connection failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()

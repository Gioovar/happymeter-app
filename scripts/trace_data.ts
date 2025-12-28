
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Tracing Survey Owners ---')

    const targetSurveyIds = [
        'aeb76435-0dd1-4a6f-9054-35db3ffbd31f',
        '8fcc0b22-982a-413d-a315-549780937bcb'
    ]

    const surveys = await prisma.survey.findMany({
        where: { id: { in: targetSurveyIds } },
        select: { id: true, title: true, userId: true }
    })

    for (const s of surveys) {
        const user = await prisma.userSettings.findUnique({
            where: { userId: s.userId },
            select: { businessName: true }
        })
        console.log(`Survey "${s.title}" belongs to User: ${s.userId} (${user?.businessName || 'Unknown'})`)
    }

    console.log('\n--- Searching for Recent Surveys (Last 24h) ---')
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const recentSurveys = await prisma.survey.findMany({
        where: { createdAt: { gte: oneDayAgo } },
        select: { id: true, title: true, userId: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
    })

    if (recentSurveys.length > 0) {
        console.log(`Found ${recentSurveys.length} recent surveys:`)
        for (const s of recentSurveys) {
            const user = await prisma.userSettings.findUnique({
                where: { userId: s.userId },
                select: { businessName: true }
            })
            console.log(`  - "${s.title}" (ID: ${s.id}) by User: ${s.userId} (${user?.businessName || 'N/A'}) at ${s.createdAt}`)
        }
    } else {
        console.log('No surveys created in the last 24 hours.')
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

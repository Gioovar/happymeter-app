import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const settings = await prisma.userSettings.findMany({
        where: {
            OR: [
                { fullName: { contains: 'Garnacheland', mode: 'insensitive' } },
                { businessName: { contains: 'Garnacheland', mode: 'insensitive' } }
            ]
        }
    })
    console.log("Found UserSettings:", settings.map(s => ({ id: s.userId, name: s.fullName, business: s.businessName })))

    for (const s of settings) {
        const chains = await prisma.chain.findMany({
            where: { ownerId: s.userId },
            include: { branches: true }
        })
        console.log(`Chains for ${s.userId}:`, JSON.stringify(chains, null, 2))

        const surveys = await prisma.survey.findMany({
            where: {
                OR: [
                    { userId: s.userId },
                    { userId: { in: chains.flatMap(c => c.branches.map(b => b.branchId)) } }
                ]
            },
            include: { _count: { select: { responses: true } } }
        })
        console.log(`Surveys for ${s.userId}:`, surveys.map(sur => ({ id: sur.id, surveyUserId: sur.userId, responses: sur._count.responses })))
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const settings = await prisma.userSettings.findMany({
        where: {
            OR: [
                { fullName: { contains: 'garnacheland', mode: 'insensitive' } },
                { businessName: { contains: 'garnacheland', mode: 'insensitive' } },
                { fullName: { contains: 'roma sur', mode: 'insensitive' } }
            ]
        }
    })

    console.log("All matching accounts:", settings.map(s => ({
        id: s.userId,
        name: s.fullName,
        business: s.businessName,
        plan: s.plan
    })))

    for (const s of settings) {
        const surveys = await prisma.survey.findMany({
            where: { userId: s.userId },
            include: { _count: { select: { responses: true } } }
        })
        console.log(`Surveys for ${s.fullName} (${s.userId}):`, surveys.map(sur => ({ id: sur.id, title: sur.title, responses: sur._count.responses })))
    }
}
main().catch(console.error).finally(() => prisma.$disconnect())

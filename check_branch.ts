import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Searching for branch 'garnacheland roma sur'...")
    const branches = await prisma.chainBranch.findMany({
        where: {
            OR: [
                { name: { contains: 'roma sur', mode: 'insensitive' } },
                { slug: { contains: 'roma-sur', mode: 'insensitive' } }
            ]
        },
        include: {
            chain: { select: { ownerId: true, name: true } }
        }
    })
    console.log("Found branches:", branches)

    if (branches.length > 0) {
        for (const b of branches) {
            const branchUserId = b.branchId
            const surveys = await prisma.survey.findMany({
                where: { userId: branchUserId },
                include: { _count: { select: { responses: true } } }
            })
            console.log(`Surveys for branch ${b.name} (${branchUserId}):`, surveys.map(s => ({ id: s.id, responses: s._count.responses })))
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())

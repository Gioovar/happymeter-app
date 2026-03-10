import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log("Searching branches...")
    const branches = await prisma.chainBranch.findMany({
        where: { name: 'Mi Negocio' },
        include: { chain: true }
    })
    console.log("Branches named 'Mi Negocio':", branches)

    // Also let's find the branch for Roma Sur just in case it's named something else
    const allBranches = await prisma.chainBranch.findMany({
        include: { chain: true }
    })
    console.log("ALL Branches in DB:", allBranches.map(b => ({ id: b.branchId, name: b.name })))

    for (const b of branches) {
        const surveys = await prisma.survey.findMany({
            where: { userId: b.branchId }
        })
        console.log(`Surveys for branch ${b.branchId}:`, surveys.length)
    }
}
main().catch(console.error).finally(() => prisma.$disconnect())

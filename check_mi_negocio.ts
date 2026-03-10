import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const branches = await prisma.chainBranch.findMany({
        where: { name: 'Mi Negocio' },
        include: { chain: true }
    })
    console.log("Branches named 'Mi Negocio':", branches)
    
    // Check surveys owned by this branch
    for (const b of branches) {
        const surveys = await prisma.survey.findMany({
            where: { userId: b.branchId }
        })
        console.log(`Surveys for branch ${b.branchId}:`, surveys.length)
    }
}
main().finally(() => prisma.$disconnect())

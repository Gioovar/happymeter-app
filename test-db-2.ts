import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Check if any surveys were recently modified or if branches are disconnected
    const recentSurveys = await prisma.survey.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { responses: true } } }
    })
    console.log("Recent Surveys:", recentSurveys.map(s => ({ id: s.id, userId: s.userId, title: s.title, respCount: s._count.responses })))
    
    // Check for recent deleted records (if we have a soft delete flag) or any logs
    // We don't have soft delete on surveys, but let's check recent ChainBranches
    const branches = await prisma.chainBranch.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    })
    console.log("Recent Branches:", branches)
}

main().finally(() => prisma.$disconnect())

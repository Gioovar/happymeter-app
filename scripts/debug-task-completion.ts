
import { PrismaClient } from '@prisma/client'
import { startOfDay, endOfDay } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    const branchId = 'user_39rALJ1Z66nz5DrNiyr1Q6gK4IJ'
    console.log(`Debugging Task Completion for Branch: ${branchId}`)

    // 1. Check ANY Evidence for TODAY (UTC) for this branch's tasks
    const now = new Date()
    const start = startOfDay(now)
    const end = endOfDay(now)

    console.log(`Checking evidence between ${start.toISOString()} and ${end.toISOString()} (UTC)`)

    // Find all zones for this branch
    const zones = await prisma.processZone.findMany({
        where: { OR: [{ userId: branchId }, { branchId: branchId }] },
        select: { id: true, name: true }
    })
    const zoneIds = zones.map(z => z.id)
    console.log(`Found ${zones.length} zones.`)

    // Find all tasks in these zones
    const tasks = await prisma.processTask.findMany({
        where: { zoneId: { in: zoneIds } },
        select: { id: true, title: true }
    })
    const taskIds = tasks.map(t => t.id)
    console.log(`Found ${tasks.length} tasks.`)

    // Find evidence for these tasks
    const recentEvidence = await prisma.processEvidence.findMany({
        where: {
            taskId: { in: taskIds }
        },
        orderBy: { submittedAt: 'desc' },
        take: 10,
        include: { task: true }
    })

    console.log(`\nFound ${recentEvidence.length} recent evidence records for this BRANCH:`)
    recentEvidence.forEach(e => {
        console.log(` - [${e.submittedAt.toISOString()}] Task: ${e.task.title} (Status: ${e.status})`)
        console.log(`   StaffId: ${e.staffId}`)
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

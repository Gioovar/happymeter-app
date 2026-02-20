
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const branchId = 'user_39rALJ1Z66nz5DrNiyr1Q6gK4IJ'

    // 1. Find Erick's UUID
    const erickDetails = await prisma.teamMember.findFirst({
        where: { userId: 'user_39rFIVSF8Lkdo6i6XoEdO0LPcGq' } // We validted this is Erick
    })

    if (!erickDetails) {
        console.log("Erick not found by UserID??")
        return
    }
    console.log(`Checking assignments for Erick (Member UUID: ${erickDetails.id})`)

    // 2. Find the Task that has evidence
    // "Apertura - Cartas listas"
    const task = await prisma.processTask.findFirst({
        where: {
            title: { contains: 'Cartas listas' },
            zone: { OR: [{ userId: branchId }, { branchId: branchId }] }
        },
        include: { zone: true }
    })

    if (!task) {
        console.log("Task 'Cartas listas' not found.")
        return
    }

    console.log(`Task Found: "${task.title}" (ID: ${task.id})`)
    console.log(`  Assigned Staff ID: ${task.assignedStaffId}`)
    console.log(`  Zone: "${task.zone.name}" (ID: ${task.zone.id})`)
    console.log(`  Zone Assigned Staff ID: ${task.zone.assignedStaffId}`)

    // Check match
    const isDirectlyAssigned = task.assignedStaffId === erickDetails.id
    const isZoneAssigned = task.zone.assignedStaffId === erickDetails.id

    console.log(`\nIs Erick assigned directly? ${isDirectlyAssigned}`)
    console.log(`Is Erick assigned via Zone? ${isZoneAssigned}`)

    if (!isDirectlyAssigned && !isZoneAssigned) {
        console.log("\nCONCLUSION: Erick is NOT assigned to this task, so he gets 0 credit in 'getProcessTeamStats'.")
    } else {
        console.log("\nCONCLUSION: Erick IS assigned. The bug is elsewhere.")
    }

}

main()
    .catch(e => {
        console.error(e)
        プロセス.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

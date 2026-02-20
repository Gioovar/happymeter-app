
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const zoneId = '68474255-123b-4e67-81d0-181a3e16d62a' // From previous step

    const zone = await prisma.processZone.findUnique({
        where: { id: zoneId }
    })

    if (!zone) {
        console.log("Zone not found")
        return
    }

    console.log(`Zone: ${zone.name}`)
    console.log(`  ID: ${zone.id}`)
    console.log(`  UserID (Owner): ${zone.userId}`)
    console.log(`  BranchID: ${zone.branchId}`)

    const expectedOwner = 'user_39rALJ1Z66nz5DrNiyr1Q6gK4IJ'
    console.log(`\nExpected Owner: ${expectedOwner}`)

    if (zone.branchId !== expectedOwner) {
        console.log("MISMATCH: getProcessTeamStats queries by branchId, but here it matches userId!")
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

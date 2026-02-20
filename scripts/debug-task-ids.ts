
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const branchId = 'user_39rALJ1Z66nz5DrNiyr1Q6gK4IJ'

    // 1. Find Erick
    const members = await prisma.teamMember.findMany({
        where: {
            ownerId: branchId,
            name: { contains: 'rick', mode: 'insensitive' }
        },
        include: { user: true }
    })

    if (members.length > 0) {
        const erick = members[0]
        console.log(`Member: ${erick.name}`)
        console.log(`  TeamMember ID (UUID): ${erick.id}`)
        console.log(`  User ID (Clerk): ${erick.userId}`)
    } else {
        console.log("Erick not found.")
    }

    // 2. Who is 'user_39rFIVSF8Lkdo6i6XoEdO0LPcGq'?
    const mysteryUser = await prisma.userSettings.findUnique({
        where: { userId: 'user_39rFIVSF8Lkdo6i6XoEdO0LPcGq' }
    })
    if (mysteryUser) {
        console.log(`\nMystery User found in UserSettings: ${mysteryUser.fullName}`)
    } else {
        console.log(`\nMystery User 'user_39rFIV...' NOT found in UserSettings.`)
    }

    // Check if it matches a TeamMember user ID
    const mysteryMember = await prisma.teamMember.findFirst({
        where: { userId: 'user_39rFIVSF8Lkdo6i6XoEdO0LPcGq' }
    })
    if (mysteryMember) {
        console.log(`Matches TeamMember: ${mysteryMember.name} (UUID: ${mysteryMember.id})`)
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

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const branchId = 'user_37SspAObOBtCtERjB21CReDLSdb'
    const members = await prisma.teamMember.findMany({
        where: { ownerId: branchId },
        include: { user: true }
    })
    console.log(`Found ${members.length} members for branch ${branchId}:`)
    members.forEach(m => {
        console.log(`- ${m.name || m.user?.fullName || 'No name'} (ID: ${m.id}, Role: ${m.role}, Active: ${m.isActive})`)
    })

    const branch = await prisma.userSettings.findUnique({ where: { userId: branchId } })
    console.log(`Branch name in DB: ${branch?.businessName}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

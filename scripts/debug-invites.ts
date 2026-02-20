
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("Checking user and memberships...")

    // Find users starting with the ID seen in screenshot
    const users = await prisma.userSettings.findMany({
        where: {
            userId: { startsWith: 'user_2' }
        }
    })
    // Wait, the screenshot says user_37... 
    // Let's broaden search or try to list recent users if I can't guess the full ID.
    // Actually, Clerk IDs often start with user_2...
    // The screenshot shows user_37SFL... which is unusual for Clerk (usually user_2...) unless it's a different ID format or I am misreading.
    // Let's just list ALL users for now (assuming not too many in dev/test) to find the right one.

    const allUsers = await prisma.userSettings.findMany({
        take: 20,
        orderBy: { userId: 'desc' } // Clerk IDs are time-sortable? Not really, but createdAt is better if available.
    })

    console.log(`Listing ${allUsers.length} recent users in UserSettings:`)

    for (const u of allUsers) {
        console.log(`User: ${u.fullName} (${u.userId})`)
        const memberships = await prisma.teamMember.findMany({
            where: { userId: u.userId },
            include: { owner: { select: { businessName: true } } }
        })
        console.log(`  Memberships: ${memberships.map(m => `${m.role} @ ${m.owner?.businessName} (${m.ownerId})`).join(', ')}`)
    }

    console.log("\n--- INVITATIONS ---")
    const invites = await prisma.teamInvitation.findMany()
    invites.forEach(inv => {
        console.log(`[${inv.role}] Token: ${inv.token} | Email: ${inv.email} | Inviter: ${inv.inviterId}`)
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

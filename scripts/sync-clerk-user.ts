
import { createClerkClient } from '@clerk/backend'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

async function main() {
    const email = process.argv[2]
    if (!email) {
        console.error('Please provide an email.')
        process.exit(1)
    }

    console.log(`Searching Clerk for ${email}...`)
    const userList = await clerk.users.getUserList({ emailAddress: [email] })

    if (userList.data.length === 0) {
        console.error('User not found in Clerk.')
        return
    }

    const clerkUser = userList.data[0]
    console.log(`Found Clerk User: ${clerkUser.id} (${clerkUser.firstName} ${clerkUser.lastName})`)

    // Upsert into Prisma
    const user = await prisma.userSettings.upsert({
        where: { userId: clerkUser.id },
        update: {
            role: 'STAFF' // Force STAFF for this fix
        },
        create: {
            userId: clerkUser.id,
            role: 'STAFF',
            hasSeenTour: false,
            maxSurveys: 3,
            plan: 'FREE'
        }
    })

    console.log(`✅ Synced/Updated User to DB:`, user)
}

main()
    .catch((e) => {
        console.error(e)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

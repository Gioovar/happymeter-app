
import { PrismaClient } from '@prisma/client'
import { createClerkClient } from '@clerk/nextjs/server'

const prisma = new PrismaClient()
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

async function main() {
    const email = 'gtrendy2017@gmail.com'
    console.log(`Looking for user with email: ${email}`)

    if (!process.env.CLERK_SECRET_KEY) {
        console.error("CLERK_SECRET_KEY is missing")
        return
    }

    // 1. Find User ID from Clerk
    const clerkUsers = await clerk.users.getUserList({
        emailAddress: [email],
        limit: 1
    })

    if (clerkUsers.data.length === 0) {
        console.log("No Clerk user found with that email.")
        return
    }

    const userId = clerkUsers.data[0].id
    console.log(`Found Clerk User ID: ${userId}`)

    // 2. Find UserSettings in DB
    const userSettings = await prisma.userSettings.findUnique({
        where: { userId },
        include: { representativeProfile: true }
    })

    if (!userSettings) {
        console.log("No UserSettings found for this userId.")
        return
    }

    console.log(`Current Role: ${userSettings.role}`)

    // 3. Update to STAFF
    if (userSettings.role !== 'STAFF') {
        console.log("Updating role to STAFF...")
        await prisma.userSettings.update({
            where: { userId },
            data: { role: 'STAFF' }
        })
        console.log("Role updated to STAFF.")
    } else {
        console.log("User is already STAFF.")
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

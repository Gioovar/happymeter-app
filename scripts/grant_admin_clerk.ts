
import { createClerkClient } from '@clerk/nextjs/server'
import { prisma } from '../src/lib/prisma'

async function findAndGrant() {
    console.log("Initializing Clerk Client...")
    // Key will be read from process.env.CLERK_SECRET_KEY automatically by Clerk, 
    // but good to check if it's there in the process env for debugging.
    if (!process.env.CLERK_SECRET_KEY) {
        console.error("ERROR: CLERK_SECRET_KEY is missing from environment. Make sure .env is loaded.")
        return
    }
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    const targetEmail = 'armelzuniga87@gmail.com'
    const targetUsername = 'lasanticdmx'

    console.log(`Debug: searching for email '${targetEmail}' or username '${targetUsername}'...`)

    try {
        // 1. Try finding by email
        let users = await clerk.users.getUserList({
            emailAddress: [targetEmail],
            limit: 1
        })

        // 2. If not found, try username
        if (users.data.length === 0) {
            console.log("Not found by email. Trying username...")
            users = await clerk.users.getUserList({
                username: [targetUsername],
                limit: 1
            })
        }

        // 3. Debug: List ANY users to verify we are connected to the right instance
        if (users.data.length === 0) {
            console.log("Not found by username either.")
            console.log("Fetching ANY 3 users to verify connection...")
            const allUsers = await clerk.users.getUserList({ limit: 3 })
            console.log(`Connection test: Found ${allUsers.data.length} users.`)
            if (allUsers.data.length > 0) {
                console.log("First user email found in instance:", allUsers.data[0].emailAddresses[0]?.emailAddress)
            } else {
                console.log("WARNING: Clerk returned 0 users total. Check if this is the correct Development/Production instance keys.")
            }
            return
        }

        const user = users.data[0]
        console.log(`Found User: ${user.id} (${user.firstName} ${user.lastName})`)
        const userEmail = user.emailAddresses[0]?.emailAddress
        console.log(`Email: ${userEmail}`)

        // Now update Prisma
        console.log("Updating UserSettings to SUPER_ADMIN...")

        // 1. Check if settings exist
        const settings = await prisma.userSettings.findUnique({
            where: { userId: user.id }
        })

        if (!settings) {
            console.log("UserSettings not found. Creating default settings with SUPER_ADMIN...")
            await prisma.userSettings.create({
                data: {
                    userId: user.id,
                    role: 'SUPER_ADMIN',
                    plan: 'ENTERPRISE',
                    isOnboarded: true,
                    businessName: "Super Admin", // Default name
                    phone: user.primaryPhoneNumberId || undefined // rudimentary
                }
            })
        } else {
            console.log("UserSettings found. Updating...")
            await prisma.userSettings.update({
                where: { userId: user.id },
                data: {
                    role: 'SUPER_ADMIN',
                    plan: 'ENTERPRISE'
                }
            })
        }

        console.log("SUCCESS! User is now SUPER_ADMIN.")

    } catch (error) {
        console.error("Error accessing Clerk or DB:", error)
    }
}

findAndGrant()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

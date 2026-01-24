import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY
const BASE_URL = 'https://api.clerk.com/v1'

async function fetchUser(query: string, type: 'email' | 'username') {
    const params = new URLSearchParams()
    if (type === 'email') params.append('email_address', query)
    else params.append('username', query)

    // Also limit 1
    params.append('limit', '1')

    const res = await fetch(`${BASE_URL}/users?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    })

    if (!res.ok) {
        throw new Error(`Clerk API Error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    return data && data.length > 0 ? data[0] : null
}

async function findAndGrant() {
    console.log("Check Env...")
    if (!CLERK_SECRET_KEY) {
        console.error("Missing CLERK_SECRET_KEY")
        return
    }

    const targetEmail = 'gtrendy2017@gmail.com'
    const targetUsername = 'lasanticdmx'

    console.log(`Debug: searching for email '${targetEmail}'...`)

    try {
        let user = await fetchUser(targetEmail, 'email')

        if (!user) {
            console.log(`Not found by email. Searching for username '${targetUsername}'...`)
            user = await fetchUser(targetUsername, 'username')
        }

        if (!user) {
            console.error("User not found by email or username.")

            // List first 5 users for debugging
            console.log("\n--- Debug: Available Users in this Instance ---")
            const res = await fetch(`${BASE_URL}/users?limit=5`, {
                headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}` }
            })
            const allUsers = await res.json()
            allUsers.forEach((u: any) => {
                console.log(`- ${u.id}: ${u.email_addresses?.[0]?.email_address} (${u.first_name} ${u.last_name})`)
            })
            return
        }

        console.log(`Found User: ${user.id} (${user.first_name} ${user.last_name})`)
        const userEmail = user.email_addresses?.[0]?.email_address
        console.log(`Email: ${userEmail}`)

        // Update Prisma
        console.log("Updating UserSettings to SUPER_ADMIN...")

        const settings = await prisma.userSettings.findUnique({
            where: { userId: user.id }
        })

        if (!settings) {
            console.log("Creating default settings...")
            await prisma.userSettings.create({
                data: {
                    userId: user.id,
                    role: 'SUPER_ADMIN', // Note: Make sure 'SUPER_ADMIN' is valid in your Enum
                    plan: 'ENTERPRISE',
                    isOnboarded: true,
                    businessName: "Super Admin",
                    phone: user.phone_numbers?.[0]?.phone_number
                }
            })
        } else {
            console.log("Updating existing settings...")
            await prisma.userSettings.update({
                where: { userId: user.id },
                data: {
                    role: 'SUPER_ADMIN', // Ensure this maps to your TeamRole or UserRole enum correctly 
                    // Wait, schema says role is UserRole (USER, STAFF, ADMIN, SUPER_ADMIN). Correct.
                    plan: 'ENTERPRISE'
                }
            })
        }

        console.log("SUCCESS! User is now SUPER_ADMIN.")

    } catch (error) {
        console.error("Error:", error)
    }
}

findAndGrant()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

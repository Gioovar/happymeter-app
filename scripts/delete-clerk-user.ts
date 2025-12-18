
import { createClerkClient } from '@clerk/nextjs/server'
import * as dotenv from 'dotenv'
import path from 'path'

// Load env vars from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// We need to ensure the environment variables are available.
// Since we are running this with 'npx tsx', if the .env.local file is not loaded automatically, we might need dotenv.
// However, let's assume standard Next.js env loading or that the user has the variables in their shell or .env file.
// If it fails on missing key, we will ask the user.

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
})

async function main() {
    const targetUserId = 'user_36GKvPBupsEHF8i5HpMkX3d6cvI'

    console.log(`Attempting to delete Clerk user: ${targetUserId}`)

    try {
        await clerkClient.users.deleteUser(targetUserId)
        console.log(`Successfully deleted user ${targetUserId} from Clerk.`)
    } catch (error: any) {
        if (error.status === 404) {
            console.log('User not found in Clerk (already deleted?)')
        } else {
            console.error('Error deleting user from Clerk:', error)
            console.log('Make sure CLERK_SECRET_KEY is set in your environment.')
        }
    }
}

main()


import { createClerkClient } from '@clerk/nextjs/server'
import { prisma } from '../src/lib/prisma'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
})

async function main() {
    const email = 'gtrendy2009@hotmail.com'
    console.log(`Looking up user for email: ${email}`)

    try {
        const users = await clerkClient.users.getUserList({
            emailAddress: [email],
            limit: 1
        })

        if (users.data.length === 0) {
            console.log('No Clerk user found for this email.')
            return
        }

        const user = users.data[0]
        console.log(`Found Clerk User: ${user.id}`)


        // Ensure UserSettings exists first (FK requirement)
        let userSettings = await prisma.userSettings.findUnique({
            where: { userId: user.id }
        })

        if (!userSettings) {
            console.log('Creating missing UserSettings...')
            userSettings = await prisma.userSettings.create({
                data: {
                    userId: user.id
                }
            })
        }

        // Check local DB for Profile
        const profile = await prisma.affiliateProfile.findUnique({
            where: { userId: user.id }
        })

        if (profile) {
            console.log('Found AffiliateProfile:', profile)

            // Force reset
            await prisma.affiliateProfile.update({
                where: { id: profile.id },
                data: {
                    niche: null,
                    audienceSize: null,
                    status: 'PENDING'
                }
            })
            console.log('Reset existing profile to force onboarding.')

        } else {
            console.log('No AffiliateProfile found. Creating one to force onboarding...')
            const baseCode = (user.firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')
            const code = `${baseCode}${Math.floor(Math.random() * 1000)}`

            await prisma.affiliateProfile.create({
                data: {
                    userId: user.id,
                    code: code,
                    status: 'PENDING',
                    paypalEmail: email
                }
            })
            console.log('Created new PENDING profile. User will be redirected on next visit.')
        }

    } catch (error) {
        console.error(error)
    }
}

main()

'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'


const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'

// 1. Create Account Link (Connect Onboarding)
export async function createStripeConnectAccount() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const user = await prisma.userSettings.findUnique({
        where: { userId },
        include: { affiliateProfile: true }
    })

    if (!user || !user.affiliateProfile) throw new Error('Creator profile not found')

    let accountId = user.affiliateProfile.stripeConnectId

    // Create Express Account if not exists
    if (!accountId) {
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'MX', // Defaulting to Mexico
            email: user.affiliateProfile.paypalEmail || undefined,
            capabilities: {
                transfers: { requested: true },
            },
            business_type: 'individual',
            settings: {
                payouts: {
                    schedule: {
                        interval: 'manual', // We control payouts
                    },
                },
            },
        })

        accountId = account.id

        // Save to DB
        await prisma.affiliateProfile.update({
            where: { id: user.affiliateProfile.id },
            data: { stripeConnectId: accountId }
        })
    }

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${APP_URL}/creators/payments`,
        return_url: `${APP_URL}/creators/payments`,
        type: 'account_onboarding',
    })

    return accountLink.url
}

// 2. Check Account Status
export async function getStripeAccountStatus() {
    const { userId } = await auth()
    if (!userId) return null

    const profile = await prisma.affiliateProfile.findUnique({
        where: { userId },
        select: { stripeConnectId: true }
    })

    if (!profile?.stripeConnectId) return { connected: false }

    try {
        const account = await stripe.accounts.retrieve(profile.stripeConnectId)
        return {
            connected: account.details_submitted,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            accountId: account.id
        }
    } catch (error) {
        console.error('Stripe Retrieve Error', error)
        return { connected: false, error: true }
    }
}

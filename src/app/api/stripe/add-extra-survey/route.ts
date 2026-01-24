import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

import { stripe } from '@/lib/stripe'
// const PRICE_ID = process.env.STRIPE_EXTRA_SURVEY_PRICE_ID

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })

        const userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })

        if (!userSettings) {
            return new NextResponse(JSON.stringify({ error: "User not found" }), { status: 404 })
        }

        if (!userSettings.stripeSubscriptionId) {
            return new NextResponse(JSON.stringify({ error: "No active subscription found. Please upgrade first." }), { status: 400 })
        }

        const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_EXTRA_SURVEY_PRICE_ID || process.env.STRIPE_EXTRA_SURVEY_PRICE_ID

        if (!PRICE_ID) {
            console.error("Missing STRIPE_EXTRA_SURVEY_PRICE_ID")
            return new NextResponse(JSON.stringify({ error: "System configuration error: Price ID not set" }), { status: 500 })
        }

        // Add Subscription Item
        await stripe.subscriptionItems.create({
            subscription: userSettings.stripeSubscriptionId,
            price: PRICE_ID,
            quantity: 1,
        });

        // Optimistic Update in Database (Webhook will reconcile eventually)
        await prisma.userSettings.update({
            where: { userId },
            data: {
                extraSurveys: { increment: 1 }
            }
        })

        return NextResponse.json({ success: true, message: "Extra survey added" })

    } catch (error: any) {
        console.error('[STRIPE_ADD_EXTRA]', error)
        return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 })
    }
}

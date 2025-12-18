import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        const user = await currentUser()

        if (!userId || !user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Get the user's subscription from DB to find the Stripe Customer ID
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })

        if (!userSettings?.stripeCustomerId) {
            return new NextResponse('No active subscription found', { status: 404 })
        }

        // Generate the Portal Session
        // This allows them to update pmt methods, cancel subs, view invoices
        const session = await stripe.billingPortal.sessions.create({
            customer: userSettings.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings`,
        })

        return NextResponse.json({ url: session.url })

    } catch (error) {
        console.error('[STRIPE_PORTAL_ERROR]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

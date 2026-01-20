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

        let stripeCustomerId = userSettings?.stripeCustomerId

        if (!stripeCustomerId) {
            // Create a new Stripe Customer if one doesn't exist
            const customer = await stripe.customers.create({
                email: user.emailAddresses[0].emailAddress,
                name: `${user.firstName} ${user.lastName}`,
                metadata: {
                    userId: userId
                }
            })

            stripeCustomerId = customer.id

            // Save the new Stripe Customer ID to database
            await prisma.userSettings.upsert({
                where: { userId },
                create: {
                    userId,
                    stripeCustomerId,
                    plan: 'FREE', // Default plan
                    interval: 'month'
                },
                update: {
                    stripeCustomerId
                }
            })
        }

        // Generate the Portal Session
        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'}/dashboard/settings`,
        })

        return NextResponse.json({ url: session.url })

    } catch (error) {
        console.error('[STRIPE_PORTAL_ERROR]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

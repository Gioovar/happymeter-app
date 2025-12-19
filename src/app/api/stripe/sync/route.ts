import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse('Unauthorized', { status: 401 })

        // 1. Get User's Customer ID
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })

        // If we don't have a customer ID yet, we might need to search Stripe by email
        // But for the flow we just did, checkout should have returned a customer ID to the webhook... 
        // WAIT. The webhook never ran, so we might NOT have the customer ID in DB yet.
        // We need to find the customer in Stripe by email.

        let stripeCustomerId = userSettings?.stripeCustomerId

        if (!stripeCustomerId) {
            const user = await currentUser()
            if (!user?.emailAddresses?.[0]?.emailAddress) {
                return new NextResponse('No email found', { status: 400 })
            }
            const email = user.emailAddresses[0].emailAddress
            console.log('[SYNC] Buscando cliente por email:', email)

            const customers = await stripe.customers.list({
                email: email,
                limit: 1
            })

            console.log('[SYNC] Clientes encontrados:', customers.data.length)

            if (customers.data.length > 0) {
                stripeCustomerId = customers.data[0].id
                // Save it for future
                await prisma.userSettings.update({
                    where: { userId },
                    data: { stripeCustomerId }
                })
            } else {
                return new NextResponse('No se encontró cliente en Stripe con este email', { status: 404 })
            }
        }

        // 2. List Active Subscriptions
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'active',
            limit: 1
        })

        console.log('[SYNC] Suscripciones activas encontradas:', subscriptions.data.length)

        if (subscriptions.data.length === 0) {
            return new NextResponse('No tienes suscripciones ACTIVAS en Stripe', { status: 404 })
        }

        const sub = subscriptions.data[0]
        const priceId = sub.items.data[0].price.id

        // 3. Map Price ID to Plan Name
        // We'll read the metadata from the subscription if available, or infer from priceId
        // Ideally we put 'plan' in metadata during checkout.
        let plan = sub.metadata.plan || 'FREE'

        // If metadata is empty (sometimes happens if not propagated), strictly map IDs
        // But we don't have the map loaded here easily unless we import `plans.ts` or checking envs.
        // Let's trust metadata first. If missing, we default to GROWTH as fallback for this test? 
        // No, let's try to be smarter.

        // Note: The checkout session had metadata. The subscription object usually inherits it if configured,
        // but by default Stripe Checkout metadata stays on the SESSION, not the SUBSCRIPTION unless `subscription_data.metadata` was set.
        // Let's check if we can retrieve the session that created this sub? Too complex.

        // Let's look at the product ID or just fallback to metadata.
        // In our checkout route, we set metadata on the session. We did NOT explicitely set `subscription_data.metadata`.
        // So the subscription might NOT have the plan name.

        // RETRY: Let's fetch the Product to get the name?
        // Or better, let's search for the Checkout Session associated with this user?

        // Let's try to recover the plan from the Price configuration
        // We can just iterate the ENV vars to match the priceId?
        const PLANS: Record<string, string> = {
            [process.env.STRIPE_PRICE_GROWTH_MONTHLY!]: 'GROWTH',
            [process.env.STRIPE_PRICE_GROWTH_YEARLY!]: 'GROWTH',
            [process.env.STRIPE_PRICE_POWER_MONTHLY!]: 'POWER',
            [process.env.STRIPE_PRICE_POWER_YEARLY!]: 'POWER',
            [process.env.STRIPE_PRICE_CHAIN_MONTHLY!]: 'CHAIN',
            [process.env.STRIPE_PRICE_CHAIN_YEARLY!]: 'CHAIN',
        }

        const mappedPlan = PLANS[priceId]
        if (mappedPlan) plan = mappedPlan

        // 4. Update DB
        await prisma.userSettings.update({
            where: { userId },
            data: {
                plan: plan as any,
                subscriptionStatus: 'active',
                stripeSubscriptionId: sub.id,
                subscriptionPeriodEnd: new Date((sub as any).current_period_end * 1000)
            }
        })

        return NextResponse.json({ success: true, plan })

    } catch (error: any) {
        console.error('Sync Error:', error)
        return new NextResponse(error.message, { status: 500 })
    }
}

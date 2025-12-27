import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { cookies } from 'next/headers'

const PLANS: Record<string, string | undefined> = {
    GROWTH_MONTH: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
    GROWTH_YEAR: process.env.STRIPE_PRICE_GROWTH_YEARLY,
    POWER_MONTH: process.env.STRIPE_PRICE_POWER_MONTHLY,
    POWER_YEAR: process.env.STRIPE_PRICE_POWER_YEARLY,
    CHAIN_MONTH: process.env.STRIPE_PRICE_CHAIN_MONTHLY,
    CHAIN_YEAR: process.env.STRIPE_PRICE_CHAIN_YEARLY
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        const user = await currentUser()

        if (!userId || !user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { plan, interval = 'month' } = body

        if (!plan || !['GROWTH', 'POWER', 'CHAIN'].includes(plan)) {
            return new NextResponse('Invalid plan', { status: 400 })
        }

        const priceKey = `${plan}_${interval.toUpperCase()}`
        const priceId = PLANS[priceKey]

        if (!priceId) {
            console.error(`❌ [CHECKOUT_ERROR] Price ID missing for key: ${priceKey}. Verify Vercel Env Vars.`)
            return new NextResponse(`Configuration Error: Price for ${plan} (${interval}) not found. Contact Support.`, { status: 500 })
        }

        // Check for affiliate cookie
        const cookieStore = await cookies()
        const affiliateRef = cookieStore.get('affiliate_ref')?.value || null

        // Get origin for return URLs
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer_email: user.emailAddresses[0].emailAddress,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                plan: plan,
                interval: interval,
                affiliateRef: affiliateRef,
            },
            allow_promotion_codes: true, // Enabled for Admin/God Mode coupons
            success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/dashboard?payment=cancelled`,
        })

        return NextResponse.json({ url: session.url })

    } catch (error) {
        console.error('[STRIPE_CHECKOUT_ERROR]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

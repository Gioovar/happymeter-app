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

const ADDON_PRICES: Record<string, { monthly: string | undefined; yearly: string | undefined }> = {
    loyalty: {
        monthly: process.env.STRIPE_PRICE_ADDON_LOYALTY_MONTHLY,
        yearly: process.env.STRIPE_PRICE_ADDON_LOYALTY_YEARLY
    },
    processes: {
        monthly: process.env.STRIPE_PRICE_ADDON_PROCESSES_MONTHLY,
        yearly: process.env.STRIPE_PRICE_ADDON_PROCESSES_YEARLY
    },
    reservations: {
        monthly: process.env.STRIPE_PRICE_ADDON_RESERVATIONS_MONTHLY,
        yearly: process.env.STRIPE_PRICE_ADDON_RESERVATIONS_YEARLY
    },
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        const user = await currentUser()

        if (!userId || !user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()
        const { plan, interval = 'month', addons = [] } = body

        // Validate Plan
        if (!plan || (!['GROWTH', 'POWER', 'CHAIN', 'custom'].includes(plan))) {
            return new NextResponse('Invalid plan', { status: 400 })
        }

        const lineItems = []
        let discounts = undefined

        if (plan === 'custom') {
            // 1. Add Base Price (Growth)
            const basePriceKey = `GROWTH_${interval.toUpperCase()}`
            const basePriceId = PLANS[basePriceKey]
            if (!basePriceId) throw new Error(`Missing base price for ${basePriceKey}`)

            lineItems.push({ price: basePriceId, quantity: 1 })

            // 2. Add Add-ons
            for (const addonId of addons) {
                const addonConfig = ADDON_PRICES[addonId]
                if (addonConfig) {
                    const priceId = interval === 'year' ? addonConfig.yearly : addonConfig.monthly
                    if (priceId) {
                        lineItems.push({ price: priceId, quantity: 1 })
                    }
                }
            }

            // 3. Apply Discount
            // 2 Addons = 15% OFF, 3 Addons = 20% OFF
            // The coupon code logic (15% vs 20%) is handled by assigning specific coupons in Stripe
            // that are restricted to the ADD-ON products only.
            if (addons.length === 2 && process.env.STRIPE_COUPON_POWER_15) {
                discounts = [{ coupon: process.env.STRIPE_COUPON_POWER_15 }]
            } else if (addons.length === 3 && process.env.STRIPE_COUPON_POWER_20) {
                discounts = [{ coupon: process.env.STRIPE_COUPON_POWER_20 }]
            }

        } else {
            // Standard Plan
            const priceKey = `${plan}_${interval.toUpperCase()}`
            const priceId = PLANS[priceKey]

            if (!priceId) {
                console.error(`❌ [CHECKOUT_ERROR] Price ID missing for key: ${priceKey}. Verify Vercel Env Vars.`)
                return new NextResponse(`Configuration Error: Price for ${plan} (${interval}) not found. Contact Support.`, { status: 500 })
            }

            lineItems.push({ price: priceId, quantity: 1 })
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
            line_items: lineItems,
            discounts: discounts,
            // Use safe access (optional chaining) or undefined if no email
            customer_email: user.emailAddresses?.[0]?.emailAddress,
            client_reference_id: userId,
            metadata: {
                userId: userId,
                plan: plan,
                interval: interval,
                addons: addons.join(','),
                affiliateRef: affiliateRef,
            },
            // If we have auto-applied discounts (Power Plan), we CANNOT allow other codes.
            allow_promotion_codes: discounts ? undefined : true,
            success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/dashboard?payment=cancelled`,
        })

        return NextResponse.json({ url: session.url })

    } catch (error: any) {
        console.error('[STRIPE_CHECKOUT_ERROR]', error)
        return new NextResponse(`Stripe Error: ${error.message}`, { status: 500 })
    }
}

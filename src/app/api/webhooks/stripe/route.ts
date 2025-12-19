import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event: Stripe.Event

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error('Missing STRIPE_WEBHOOK_SECRET')
            return new NextResponse('Webhook signer secret missing', { status: 500 })
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error: any) {
        console.error('Webhook Error:', error.message)
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session

    if (event.type === 'checkout.session.completed') {
        const userId = session.client_reference_id
        const metadata = session.metadata || {}
        const { plan, affiliateRef, interval } = metadata
        const amountTotal = session.amount_total || 0 // in cents

        if (!userId || !plan) {
            console.error('Missing userId or plan in metadata')
            return new NextResponse('Invalid metadata', { status: 400 })
        }

        try {
            // 1. Activate User Plan
            await prisma.userSettings.upsert({
                where: { userId },
                update: {
                    plan: plan,
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    subscriptionStatus: 'active', // Assumed active on checkout success
                    // If you wanted to store specific limits derived from plan, you could do it here
                    // but we typically read limits from the static PLAN_LIMITS config based on the 'plan' string.
                },
                create: {
                    userId,
                    plan: plan,
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    subscriptionStatus: 'active',
                    isOnboarded: true
                }
            })

            // 2. Record Sale
            await prisma.sale.create({
                data: {
                    userId,
                    plan,
                    amount: amountTotal / 100,
                    currency: session.currency || 'usd',
                    status: 'COMPLETED'
                }
            })

            // 3. Handle Affiliate Commission (if applicable)
            if (affiliateRef) {
                // Find affiliate profile by referral code
                const affiliate = await prisma.affiliateProfile.findUnique({
                    where: { code: affiliateRef }
                })

                if (affiliate) {
                    const commissionRate = 0.40 // 40% commission
                    const commissionAmount = (amountTotal / 100) * commissionRate

                    // Create Commission Record
                    await prisma.commission.create({
                        data: {
                            affiliateId: affiliate.id,
                            amount: commissionAmount,
                            description: `Comisión del 40% por venta de plan ${plan} (${interval})`,
                            status: 'PENDING' // Pending until payout
                        }
                    })

                    // Update Affiliate Balance
                    await prisma.affiliateProfile.update({
                        where: { id: affiliate.id },
                        data: {
                            balance: { increment: commissionAmount }
                        }
                    })

                    // Update Referral Status if it exists
                    await prisma.referral.updateMany({
                        where: {
                            affiliateId: affiliate.id,
                            referredUserId: userId
                        },
                        data: {
                            status: 'CONVERTED',
                            convertedAt: new Date()
                        }
                    })
                }
            }

        } catch (dbError) {
            console.error('Database Error in Webhook:', dbError)
            return new NextResponse('Database Error', { status: 500 })
        }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription

        try {
            // Check if we have this subscription in our DB
            await prisma.userSettings.updateMany({
                where: { stripeSubscriptionId: subscription.id },
                data: {
                    subscriptionStatus: subscription.status,
                    subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000)
                }
            })
        } catch (error) {
            console.error('Error syncing subscription status:', error)
            // Don't fail the webhook for this, just log it
        }
    }

    return new NextResponse('Webhook Received', { status: 200 })
}



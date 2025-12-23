
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { sendWhatsAppTemplate } from '@/lib/alerts'
import { startOfDay, endOfDay, addDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        console.log('⏰ Starting Subscription Alerts Cron...')

        const today = new Date()
        const targetDates = [
            { days: 3, label: '3 Days' },
            { days: 7, label: '7 Days' },
            { days: 30, label: '30 Days' }
        ]

        const results = {
            processed: 0,
            sent: 0,
            errors: 0,
            details: [] as string[]
        }

        for (const target of targetDates) {
            const checkDate = addDays(today, target.days)

            // Find users expiring on this specific date
            const expringUsers = await prisma.userSettings.findMany({
                where: {
                    subscriptionStatus: 'active',
                    subscriptionPeriodEnd: {
                        gte: startOfDay(checkDate),
                        lte: endOfDay(checkDate)
                    },
                    phone: { not: null } // Can't alert without phone
                },
                select: {
                    userId: true,
                    phone: true,
                    businessName: true,
                    stripeSubscriptionId: true
                }
            })

            console.log(`[Cron] Found ${expringUsers.length} users expiring in ${target.label}`)

            for (const user of expringUsers) {
                if (!user.stripeSubscriptionId || !user.phone) continue

                try {
                    // 1. Verify Plan Interval with Stripe
                    const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
                    const interval = sub.items.data[0]?.price?.recurring?.interval // 'month' or 'year'

                    let templateName = ''
                    const dateString = checkDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
                    const clientName = user.businessName || 'Cliente'

                    // 2. Determine Template
                    if (target.days === 3 && interval === 'month') {
                        templateName = 'hm_billing_monthly_expiry_v1'
                        // Cols: {{1}}=Name, {{2}}=Date
                        await sendWhatsappBilling(user.phone, templateName, [clientName, dateString])

                    } else if (target.days === 30 && interval === 'year') {
                        templateName = 'hm_billing_annual_1m_v1'
                        await sendWhatsappBilling(user.phone, templateName, [clientName, dateString])

                    } else if (target.days === 7 && interval === 'year') {
                        templateName = 'hm_billing_annual_1w_v1'
                        await sendWhatsappBilling(user.phone, templateName, [clientName, dateString])
                    }

                    if (templateName) {
                        results.sent++
                        results.details.push(`Sent ${templateName} to ${user.userId}`)
                    }

                } catch (err: any) {
                    console.error(`Error processing user ${user.userId}:`, err.message)
                    results.errors++
                }
                results.processed++
            }
        }

        return NextResponse.json({ success: true, results })

    } catch (error: any) {
        console.error('[CRON ERROR]', error)
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}

async function sendWhatsappBilling(phone: string, template: string, params: string[]) {
    // Map string params to component objects
    const components = params.map(text => ({ type: 'text', text }))
    return await sendWhatsAppTemplate(phone, template, 'es_MX', components)
}

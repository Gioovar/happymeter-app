'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe'


// Fetch detailed creator data
export async function getCreatorDetails(creatorId: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Verify Staff/Admin role
    const caller = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })

    if (caller?.role !== 'STAFF' && caller?.role !== 'SUPER_ADMIN' && caller?.role !== 'ADMIN') {
        throw new Error('Forbidden')
    }

    const creator = await prisma.affiliateProfile.findUnique({
        where: { id: creatorId },
        include: {
            user: {
                select: {
                    businessName: true,
                    phone: true,
                    socialLinks: true
                }
            },
            visits: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { place: true }
            },
            commissions: {
                take: 20,
                orderBy: { createdAt: 'desc' }
            },
            payouts: {
                take: 10,
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!creator) throw new Error('Creator not found')

    return creator
}

// Create a Penalty / Adjustment
export async function createAdjustment(creatorId: string, amount: number, reason: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Verify Staff/Admin role
    const caller = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })

    if (caller?.role !== 'STAFF' && caller?.role !== 'SUPER_ADMIN' && caller?.role !== 'ADMIN') {
        throw new Error('Forbidden')
    }

    if (amount <= 0) throw new Error('Amount must be positive (it will be deducted)')
    if (!reason) throw new Error('Reason is required')

    await prisma.$transaction(async (tx) => {
        // Create Negative Commission (Simulating Penalty)
        await tx.commission.create({
            data: {
                affiliateId: creatorId,
                amount: -Math.abs(amount), // Ensure negative
                description: `PENALIZACIÓN: ${reason}`,
                status: 'PAID' // Instant deduction
            }
        })

        // Decrement Balance
        await tx.affiliateProfile.update({
            where: { id: creatorId },
            data: {
                balance: { decrement: Math.abs(amount) }
            }
        })

        // Notify Creator
        // (Assumed Notification model exists)
        const creator = await tx.affiliateProfile.findUnique({ where: { id: creatorId } })
        if (creator) {
            await tx.notification.create({
                data: {
                    userId: creator.userId,
                    type: 'SYSTEM',
                    title: 'Ajuste de Saldo',
                    message: `Se ha aplicado un descuento de $${amount.toFixed(2)} por: ${reason}`,
                }
            })
        }
    })

    revalidatePath('/staff/creators')
    return { success: true }
}

// Process a payout (Manual or Stripe)
export async function processPayout(creatorId: string, amount: number, message?: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Verify Staff/Admin role
    const caller = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })

    if (caller?.role !== 'STAFF' && caller?.role !== 'SUPER_ADMIN' && caller?.role !== 'ADMIN') {
        throw new Error('Forbidden')
    }

    // Transaction: Create Payout -> Decrement Balance -> Stripe Transfer (if applicable)
    try {
        const creator = await prisma.affiliateProfile.findUnique({
            where: { id: creatorId }
        })

        if (!creator || creator.balance < amount) {
            throw new Error('Insufficient balance')
        }

        let stripeTransferId = null

        // Try Stripe Payout
        if (creator.stripeConnectId) {
            try {
                // Check if payouts enabled
                const account = await stripe.accounts.retrieve(creator.stripeConnectId)
                if (account.payouts_enabled) {
                    const transfer = await stripe.transfers.create({
                        amount: Math.round(amount * 100), // Cents
                        currency: 'mxn', // Assuming MXN context
                        destination: creator.stripeConnectId,
                        description: message || 'Pago de Comisiones HappyMeter',
                    })
                    stripeTransferId = transfer.id
                } else {
                    console.warn('Stripe Payouts not enabled for account', creator.stripeConnectId)
                    // We continue with Manual payout logging but warn? Or fail?
                    // For now, let's treat it as Manual and maybe log an error in the note
                }
            } catch (stripeError) {
                console.error('Stripe Transfer Failed:', stripeError)
                throw new Error('Stripe Transfer Failed: ' + (stripeError as any).message)
            }
        }

        await prisma.$transaction(async (tx) => {
            // 1. Create Payout Record
            await tx.payout.create({
                data: {
                    affiliateId: creatorId,
                    amount: amount,
                    status: stripeTransferId ? 'STRIPE_COMPLETED' : 'MANUAL_COMPLETED',
                }
            })

            // 2. Decrement Balance
            await tx.affiliateProfile.update({
                where: { id: creatorId },
                data: {
                    balance: { decrement: amount }
                }
            })

            // 3. Create Notification for Creator
            await tx.notification.create({
                data: {
                    userId: creator.userId,
                    type: 'SYSTEM',
                    title: 'Pago Enviado',
                    message: message ? `Pago de $${amount.toFixed(2)} enviado. Nota: ${message}` : `Se ha enviado un pago de $${amount.toFixed(2)}.`,
                }
            })
        })

        revalidatePath('/staff/creators')
        return { success: true, method: stripeTransferId ? 'STRIPE' : 'MANUAL' }
    } catch (error) {
        console.error('Payout Error:', error)
        throw new Error((error as any).message || 'Failed to process payout')
    }
}

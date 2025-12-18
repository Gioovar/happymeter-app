import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function GET() {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    // Verify Admin
    const admin = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })
    if (admin?.role !== 'SUPER_ADMIN') return new NextResponse('Forbidden', { status: 403 })

    // Fetch Pending commissions
    const commissions = await prisma.commission.findMany({
        where: { status: 'PENDING' },
        include: { affiliate: true },
        orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ commissions })
}

export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    // 1. Verify Super Admin
    const admin = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })

    if (admin?.role !== 'SUPER_ADMIN') {
        return new NextResponse('Forbidden', { status: 403 })
    }

    try {
        const { commissionId } = await req.json()

        // 2. Fetch Commission & Creator details
        const commission = await prisma.commission.findUnique({
            where: { id: commissionId },
            include: { affiliate: true }
        })

        if (!commission) return new NextResponse('Commission not found', { status: 404 })
        if (commission.status === 'PAID') return new NextResponse('Already paid', { status: 400 })

        const destinationAccount = commission.affiliate.stripeConnectId

        if (!destinationAccount) {
            return new NextResponse('Creator has no connected Stripe account', { status: 400 })
        }

        // 3. Execute Transfer
        // Note: 'amount' in DB is usually float (e.g. 10.50). Stripe needs cents (1050).
        const amountInCents = Math.round(commission.amount * 100)

        const transfer = await stripe.transfers.create({
            amount: amountInCents,
            currency: 'usd', // Assuming USD for now, should match DB currency
            destination: destinationAccount,
            description: `Commission Payment #${commission.id} - ${commission.description}`,
            metadata: {
                commissionId: commission.id,
                affiliateId: commission.affiliateId
            }
        })

        // 4. Update DB Status
        await prisma.commission.update({
            where: { id: commissionId },
            data: {
                status: 'PAID',
            }
        })

        return NextResponse.json({ success: true, transferId: transfer.id })

    } catch (error: any) {
        console.error('Payout Error:', error)
        return new NextResponse(error.message || 'Transfer failed', { status: 500 })
    }
}

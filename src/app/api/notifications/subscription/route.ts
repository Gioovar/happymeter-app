export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        const subscription = await req.json()

        const globalPromoterId = subscription.globalPromoterId || null;

        if (!userId && !globalPromoterId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Upsert subscription manually
        const existingSub = await (prisma as any).pushSubscription.findFirst({
            where: {
                userId: userId || undefined,
                globalPromoterId: globalPromoterId || undefined,
                endpoint: subscription.endpoint
            }
        })

        if (existingSub) {
            await (prisma as any).pushSubscription.update({
                where: { id: existingSub.id },
                data: { keys: subscription.keys }
            })
        } else {
            await (prisma as any).pushSubscription.create({
                data: {
                    userId: userId || null,
                    globalPromoterId: globalPromoterId,
                    endpoint: subscription.endpoint,
                    keys: subscription.keys
                }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving subscription:', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

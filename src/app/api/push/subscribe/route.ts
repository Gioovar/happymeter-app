export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const subscription = await req.json()

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return new NextResponse("Invalid subscription data", { status: 400 })
        }

        // Save subscription
        // Save subscription
        const existingSub = await prisma.pushSubscription.findFirst({
            where: {
                userId,
                endpoint: subscription.endpoint
            }
        })

        if (existingSub) {
            await prisma.pushSubscription.update({
                where: { id: existingSub.id },
                data: { keys: subscription.keys }
            })
        } else {
            await prisma.pushSubscription.create({
                data: {
                    userId,
                    endpoint: subscription.endpoint,
                    keys: subscription.keys
                }
            })
        }

        return new NextResponse("Subscribed", { status: 200 })
    } catch (error) {
        console.error('[PUSH_SUBSCRIBE]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

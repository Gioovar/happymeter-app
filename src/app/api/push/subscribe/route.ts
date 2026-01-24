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
        await prisma.pushSubscription.upsert({
            where: {
                userId_endpoint: {
                    userId,
                    endpoint: subscription.endpoint
                }
            },
            update: {
                keys: subscription.keys
            },
            create: {
                userId,
                endpoint: subscription.endpoint,
                keys: subscription.keys
            }
        })

        return new NextResponse("Subscribed", { status: 200 })
    } catch (error) {
        console.error('[PUSH_SUBSCRIBE]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

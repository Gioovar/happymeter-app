import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const subscription = await req.json()

        // Upsert subscription
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

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving subscription:', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

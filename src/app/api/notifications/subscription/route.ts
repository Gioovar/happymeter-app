import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const subscription = await req.json()

        // Upsert subscription
        // Upsert subscription manually
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

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving subscription:', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

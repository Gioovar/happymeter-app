import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { token, platform, userId, customerId, globalPromoterId, appType } = body

        if (!token || !platform || !appType) {
            return new NextResponse("Missing required fields (token, platform, appType)", { status: 400 })
        }

        // Upsert the token to handle updates if it already exists
        const deviceToken = await (prisma as any).deviceToken.upsert({
            where: { token },
            update: {
                platform,
                appType,
                userId: userId || null, // Keep null if not provided
                customerId: customerId || null,
                globalPromoterId: globalPromoterId || null,
                isActive: true,
                updatedAt: new Date(),
            },
            create: {
                token,
                platform,
                appType,
                userId: userId || null,
                customerId: customerId || null,
                globalPromoterId: globalPromoterId || null,
                isActive: true,
            }
        })

        return NextResponse.json({ success: true, deviceToken })

    } catch (error) {
        console.error('[DEVICE_TOKEN_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

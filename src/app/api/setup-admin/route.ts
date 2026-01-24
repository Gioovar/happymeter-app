
import { NextRequest, NextResponse } from 'next/server'
import { createClerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    // 0. Manual Parse Fallback (in case nextUrl fails)
    const url = new URL(request.url)
    const secret = searchParams.get('secret') || url.searchParams.get('secret')
    const email = searchParams.get('email') || url.searchParams.get('email')

    // 1. Simple protection
    if (secret?.trim() !== 'HAPPY_GOD_MODE_2025') {
        return NextResponse.json({
            error: 'Unauthorized',
            received: secret,
            url: request.url,
            tips: "Check if the URL contains ?secret=HAPPY_GOD_MODE_2025"
        }, { status: 401 })
    }

    if (!email) {
        return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    try {
        const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

        // 2. Find User in Clerk
        const users = await clerk.users.getUserList({
            emailAddress: [email],
            limit: 1
        })

        if (users.data.length === 0) {
            return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 })
        }

        const user = users.data[0]

        // 3. Update DB
        const result = await prisma.userSettings.upsert({
            where: { userId: user.id },
            update: {
                role: 'SUPER_ADMIN',
                plan: 'ENTERPRISE'
            },
            create: {
                userId: user.id,
                role: 'SUPER_ADMIN',
                plan: 'ENTERPRISE',
                isOnboarded: true,
                businessName: "Super Admin",
                phone: user.primaryPhoneNumberId || undefined
            }
        })

        return NextResponse.json({
            success: true,
            message: `User ${email} is now SUPER_ADMIN`,
            user: { id: user.id, role: result.role }
        })

    } catch (error: any) {
        console.error("Promotion Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

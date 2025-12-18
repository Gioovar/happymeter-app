import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const { phone, code } = await req.json()

        console.log(`[MOCK_CHECK] Verifying code ${code} for ${phone}...`)

        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 800))

        // MOCK LOGIC: El código siempre es 123456
        if (code !== '123456') {
            return NextResponse.json({ success: false, message: "Invalid code" }, { status: 400 })
        }

        // Create or Update verification status
        await prisma.userSettings.upsert({
            where: { userId },
            update: {
                isPhoneVerified: true,
                phoneVerifiedAt: new Date(),
                phone: phone
            },
            create: {
                userId,
                isPhoneVerified: true,
                phoneVerifiedAt: new Date(),
                phone: phone,
                plan: 'FREE', // Default plan
                isOnboarded: false
            }
        })

        return NextResponse.json({ success: true, message: "Verified" })
    } catch (error) {
        console.error('[VERIFY_CHECK]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { code } = body

        if (!code) return new NextResponse("Missing code", { status: 400 })

        // Find Affiliate
        const profile = await prisma.affiliateProfile.findUnique({
            where: { code: code.toLowerCase() }
        })

        if (!profile) return new NextResponse("Invalid code", { status: 404 })

        // Track Click
        await prisma.linkClick.create({
            data: {
                affiliateId: profile.id,
                ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
                userAgent: req.headers.get('user-agent') || 'unknown'
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[TRACK_CLICK]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

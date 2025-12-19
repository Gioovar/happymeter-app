
import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// TODO: Move to a config or env var
const ADMIN_EMAILS = ['admin@happymeter.com', 'gioovar@gmail.com'] // Replace with real admin emails

async function isAdmin() {
    const user = await currentUser()
    if (!user || !user.emailAddresses.some(email => ADMIN_EMAILS.includes(email.emailAddress))) {
        return false
    }
    return true
}

export async function GET() {
    try {
        if (!await isAdmin()) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(coupons)
    } catch (error) {
        console.error('[ADMIN_COUPONS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        if (!await isAdmin()) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const body = await req.json()
        const { code, type, value, maxUses, expiresAt } = body

        if (!code || !type || !value) {
            return new NextResponse("Missing required fields", { status: 400 })
        }

        // Check if code exists
        const existing = await prisma.coupon.findUnique({
            where: { code }
        })

        if (existing) {
            return new NextResponse("Coupon code already exists", { status: 400 })
        }

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                type,
                value: parseFloat(value),
                maxUses: maxUses ? parseInt(maxUses) : null,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        })

        // Audit Log
        const user = await currentUser()
        await prisma.auditLog.create({
            data: {
                adminId: user?.id || 'unknown',
                action: 'CREATE_COUPON',
                entityId: coupon.id,
                details: { code: coupon.code, type: coupon.type, value: coupon.value }
            }
        })

        return NextResponse.json(coupon)
    } catch (error) {
        console.error('[ADMIN_COUPONS_POST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        if (!await isAdmin()) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) {
            return new NextResponse("ID required", { status: 400 })
        }

        await prisma.coupon.delete({
            where: { id }
        })

        // Audit Log
        const user = await currentUser()
        await prisma.auditLog.create({
            data: {
                adminId: user?.id || 'unknown',
                action: 'DELETE_COUPON',
                entityId: id,
                details: {}
            }
        })

        return new NextResponse(null, { status: 200 })
    } catch (error) {
        console.error('[ADMIN_COUPONS_DELETE]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

async function verifySuperAdmin() {
    const user = await currentUser()
    if (!user) return false

    const dbUser = await prisma.userSettings.findUnique({
        where: { userId: user.id }
    })

    const isGod = dbUser?.role === 'SUPER_ADMIN' ||
        user.emailAddresses.some(e => ['armelzuniga87@gmail.com', 'gioovar@gmail.com', 'gtrendy2017@gmail.com'].includes(e.emailAddress));

    return isGod
}

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        if (!await verifySuperAdmin()) {
            return new NextResponse(JSON.stringify({ error: "Unauthorized: God Mode Required" }), { status: 403 })
        }

        const { userId } = await params
        if (!userId) return new NextResponse(JSON.stringify({ error: "User ID required" }), { status: 400 })

        // Create a sign-in token for the user
        const client = await clerkClient()
        const signInToken = await client.signInTokens.createSignInToken({
            userId: userId,
            expiresInSeconds: 60, // Short expiry for security
        })

        // Audit Log
        const admin = await currentUser()
        await prisma.auditLog.create({
            data: {
                adminId: admin?.id || 'unknown',
                action: 'IMPERSONATE_USER',
                details: {
                    tokenId: signInToken.id,
                    targetUserId: userId
                }
            }
        })

        const { searchParams } = new URL(req.url)
        const redirectPath = searchParams.get('redirect_url') || '/dashboard'

        const host = req.headers.get('host')
        const protocol = req.headers.get('x-forwarded-proto') || 'http'
        const baseUrl = `${protocol}://${host}`

        const tokenUrl = new URL(signInToken.url)
        tokenUrl.searchParams.set('redirect_url', `${baseUrl}${redirectPath}`)

        console.log('[IMPERSONATE] Redirecting to:', tokenUrl.toString())

        return NextResponse.json({ url: tokenUrl.toString() })

    } catch (error) {
        console.error('[ADMIN_IMPERSONATE_POST] Error details:', error)
        return new NextResponse(JSON.stringify({ error: String(error) }), { status: 500 })
    }
}


import { NextResponse } from 'next/server'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// TODO: Unified Admin Check from src/actions/admin.ts
async function isAdmin() {
    const user = await currentUser()
    // For now, if they are authenticated and hitting this endpoint, we assume middleware/layout handled the basic check.
    // Ideally we should have a 'role' in publicMetadata.
    if (!user) {
        return false
    }
    return true
}

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        if (!await isAdmin()) {
            return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 403 })
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

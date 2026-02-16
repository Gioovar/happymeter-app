import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const { membershipId } = await request.json()

        // Verify the membership belongs to the user
        const member = await prisma.teamMember.findUnique({
            where: { id: membershipId, userId, isActive: true }
        })

        if (!member) {
            return NextResponse.json({ error: 'Invalid membership' }, { status: 403 })
        }

        // Set the new context cookie
        const cookieStore = await cookies()
        cookieStore.set('ops_context_id', membershipId, {
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error switching context:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

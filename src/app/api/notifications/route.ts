import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { getEffectiveUserId } from '@/lib/auth-context'

export async function GET(req: Request) {
    try {
        const user = await currentUser()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'
        const branchSlug = searchParams.get('branchSlug') || undefined

        // Resolve active business context strictly using auth-context
        const effectiveUserId = await getEffectiveUserId(branchSlug)
        if (!effectiveUserId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: {
                    userId: effectiveUserId,
                    ...(unreadOnly ? { isRead: false } : {})
                },
                take: 20,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.notification.count({
                where: {
                    userId: effectiveUserId,
                    isRead: false
                }
            })
        ])

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await currentUser()
        if (!user) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const { notificationId, markAll, branchSlug } = body

        const effectiveUserId = await getEffectiveUserId(branchSlug || undefined)
        if (!effectiveUserId) return new NextResponse('Unauthorized', { status: 401 })

        if (markAll) {
            await prisma.notification.updateMany({
                where: { userId: effectiveUserId, isRead: false },
                data: { isRead: true }
            })
        } else if (notificationId) {
            await prisma.notification.update({
                where: { id: notificationId, userId: effectiveUserId },
                data: { isRead: true }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in PATCH notification:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const user = await currentUser()
        if (!user) return new NextResponse('Unauthorized', { status: 401 })

        const { searchParams } = new URL(req.url)
        const branchSlug = searchParams.get('branchSlug') || undefined

        const effectiveUserId = await getEffectiveUserId(branchSlug)
        if (!effectiveUserId) return new NextResponse('Unauthorized', { status: 401 })

        await prisma.notification.deleteMany({
            where: { userId: effectiveUserId, isRead: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE notification:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

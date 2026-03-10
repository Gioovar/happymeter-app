import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { getActiveBusinessId } from '@/lib/tenant'

export async function GET(req: Request) {
    try {
        const user = await currentUser()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        // Resolve active business context
        const effectiveUserId = await getActiveBusinessId()
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

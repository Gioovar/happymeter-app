import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(req: Request) {
    try {
        const user = await currentUser()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where: {
                    userId: user.id,
                    ...(unreadOnly ? { isRead: false } : {})
                },
                take: 20,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.notification.count({
                where: {
                    userId: user.id,
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

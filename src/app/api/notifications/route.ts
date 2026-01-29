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

        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id,
                ...(unreadOnly ? { isRead: false } : {})
            },
            take: 20,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(notifications)
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await currentUser()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Verify ownership
        const notification = await prisma.notification.findUnique({
            where: { id: params.id }
        })

        if (!notification || notification.userId !== user.id) {
            return new NextResponse('Not Found or Unauthorized', { status: 404 })
        }

        await prisma.notification.update({
            where: { id: params.id },
            data: { isRead: true }
        })

        return new NextResponse('Marked as read', { status: 200 })
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

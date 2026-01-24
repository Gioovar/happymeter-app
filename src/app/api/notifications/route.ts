
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// ... existing imports ...
import { subDays } from 'date-fns'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // AUTO-CLEANUP: Delete read notifications older than 30 days
        // This runs "lazily" on fetch to keep DB clean without cron
        const thirtyDaysAgo = subDays(new Date(), 30)
        await prisma.notification.deleteMany({
            where: {
                userId,
                isRead: true,
                createdAt: { lt: thirtyDaysAgo }
            }
        })

        // Fetch unread + recent read notifications (limit 30)
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30
        })

        // Count unread
        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false }
        })

        return NextResponse.json({ notifications, unreadCount })

    } catch (error) {
        console.error('[NOTIFICATIONS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    // Optional: for manual checks or test notifications
    return new NextResponse("Method not allowed", { status: 405 })
}

export async function PATCH(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { notificationId, markAll } = body

        if (markAll) {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            })
            return NextResponse.json({ success: true })
        }

        if (notificationId) {
            const notif = await prisma.notification.findUnique({
                where: { id: notificationId }
            })

            if (!notif || notif.userId !== userId) {
                return new NextResponse("Not Found or Unauthorized", { status: 404 })
            }

            await prisma.notification.update({
                where: { id: notificationId },
                data: { isRead: true }
            })
            return NextResponse.json({ success: true })
        }

        return new NextResponse("Bad Request", { status: 400 })

    } catch (error) {
        console.error('[NOTIFICATIONS_PATCH]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Delete all READ notifications for this user
        // We keep unread ones to avoid accidental data loss
        const result = await prisma.notification.deleteMany({
            where: {
                userId,
                isRead: true
            }
        })

        return NextResponse.json({
            success: true,
            deletedCount: result.count,
            message: `Deleted ${result.count} read notifications`
        })

    } catch (error) {
        console.error('[NOTIFICATIONS_DELETE]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

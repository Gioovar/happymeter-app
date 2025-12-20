import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/push'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Verify Admin Role
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId }
        })

        if (!userSettings || userSettings.role !== 'SUPER_ADMIN') {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const { target, targetUserId, title, date, body, icon, url } = await req.json()

        if (!title || !body) {
            return new NextResponse("Missing title or body", { status: 400 })
        }

        // Determine audience
        let whereClause: any = {}

        switch (target) {
            case 'ALL':
                // All users with subscriptions
                break;
            case 'STAFF':
                whereClause = { role: 'STAFF' }
                break;
            case 'CREATORS':
                // Users who have an affiliate profile
                whereClause = { affiliateProfile: { isNot: null } }
                break;
            case 'SPECIFIC':
                if (!targetUserId) return new NextResponse("Target User ID required", { status: 400 })
                whereClause = { userId: targetUserId }
                break;
            default:
                return new NextResponse("Invalid target", { status: 400 })
        }

        // Fetch subscriptions
        // We query UserSettings first to filter by role/profile, then include subscriptions
        const users = await prisma.userSettings.findMany({
            where: whereClause,
            include: {
                pushSubscriptions: true
            }
        })

        const subscriptions = users.flatMap(u => u.pushSubscriptions)

        if (subscriptions.length === 0) {
            return new NextResponse("No subscriptions found for target audience", { status: 404 })
        }

        console.log(`Sending push to ${subscriptions.length} devices...`)

        const payload = {
            title,
            body,
            icon: icon || '/happymeter_logo.png',
            url: url || '/dashboard'
        }

        // Send in parallel setteld
        const results = await Promise.allSettled(
            subscriptions.map(sub => sendPushNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload))
        )

        const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length
        const failureCount = results.length - successCount

        return NextResponse.json({
            success: true,
            total: subscriptions.length,
            sent: successCount,
            failed: failureCount
        })

    } catch (error) {
        console.error('[PUSH_SEND]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

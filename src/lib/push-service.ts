import webpush from 'web-push'
import { prisma } from '@/lib/prisma'

// Allow Vercel to generate VAPID keys if not present, but for now we expect them
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:soporte@happymeters.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

interface PushPayload {
    title: string
    body: string
    url?: string
    icon?: string
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
    try {
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        })

        if (subscriptions.length === 0) return

        const notifications = subscriptions.map(sub => {
            return webpush.sendNotification(
                {
                    endpoint: sub.endpoint,
                    keys: sub.keys as any
                },
                JSON.stringify(payload)
            ).catch(async (err) => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired or gone, delete it
                    await prisma.pushSubscription.delete({ where: { id: sub.id } })
                }
                console.error('Push error:', err)
            })
        })

        await Promise.all(notifications)
    } catch (error) {
        console.error('Error sending push:', error)
    }
}

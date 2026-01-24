import webpush from 'web-push'

// Configure VAPID keys
// In production, these should be environment variables
// VAPID_SUBJECT is commonly a mailto link
const subject = 'mailto:soporte@happymeters.com'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const privateKey = process.env.VAPID_PRIVATE_KEY || ''

if (publicKey && privateKey) {
    try {
        webpush.setVapidDetails(subject, publicKey, privateKey)
    } catch (error) {
        console.error('Failed to set VAPID details', error)
    }
} else {
    console.warn('VAPID keys not configured. Push notifications will not work.')
}

export async function sendPushNotification(subscription: any, payload: string | object) {
    if (!publicKey || !privateKey) {
        console.error('Missing VAPID keys')
        return { success: false, error: 'Missing VAPID keys' }
    }

    try {
        const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)
        await webpush.sendNotification(subscription, payloadString)
        return { success: true }
    } catch (error) {
        console.error('Error sending push notification', error)
        return { success: false, error }
    }
}

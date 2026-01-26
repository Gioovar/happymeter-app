import { useState, useEffect } from 'react'
import { urlBase64ToUint8Array } from '@/lib/utils'

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setPermission(Notification.permission)
            registerServiceWorker()
        }
    }, [])

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)

            // Re-sync subscription with backend if needed
            if (sub) {
                await saveSubscription(sub)
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error)
        }
    }

    const askPermission = async () => {
        const result = await Notification.requestPermission()
        setPermission(result)
        if (result === 'granted') {
            await subscribeUser()
        }
    }

    const subscribeUser = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            })
            setSubscription(sub)
            await saveSubscription(sub)
            return sub
        } catch (error) {
            console.error('Failed to subscribe:', error)
        }
    }

    const saveSubscription = async (sub: PushSubscription) => {
        // Send to backend
        await fetch('/api/notifications/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub)
        })
    }

    return { permission, askPermission, subscription }
}

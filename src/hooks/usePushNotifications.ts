'use client'

import { useState, useEffect } from 'react'

// Helper to decode VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission)
            checkSubscription()
        }
    }, [])

    const checkSubscription = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
        }
    }

    const subscribe = async () => {
        setLoading(true)
        try {
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service Worker not supported')
            }

            // Explicitly register service worker to prevent hanging if next-pwa failed
            const registration = await navigator.serviceWorker.register('/sw.js')
            await navigator.serviceWorker.ready // Wait for it to be active

            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

            if (!vapidPublicKey) {
                throw new Error('Missing VAPID Public Key')
            }

            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            })

            // Send to server
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            })

            setIsSubscribed(true)
            setPermission('granted')

            return true
        } catch (error) {
            console.error('Failed to subscribe', error)
            return false
        } finally {
            setLoading(false)
        }
    }

    return {
        isSubscribed,
        loading,
        permission,
        subscribe
    }
}

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
            console.log('Registering Service Worker...')

            // 1. Force unregister to clear stuck workers
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations()
                for (const reg of regs) {
                    await reg.unregister()
                    console.log('Unregistered existing SW')
                }
            }

            const registration = await navigator.serviceWorker.register('/sw.js')

            console.log('SW Registration state:', {
                installing: registration.installing?.state,
                waiting: registration.waiting?.state,
                active: registration.active?.state
            })

            // 3. Robust Wait for Active
            const waitForActive = (reg: ServiceWorkerRegistration) => {
                return new Promise<void>((resolve, reject) => {
                    if (reg.active?.state === 'activated') return resolve()

                    const serviceWorker = reg.installing || reg.waiting || reg.active
                    if (!serviceWorker) {
                        // Fallback to ready
                        navigator.serviceWorker.ready.then(() => resolve())
                        return
                    }

                    const timeout = setTimeout(() => reject(new Error('SW activation timeout')), 15000)

                    serviceWorker.addEventListener('statechange', (e) => {
                        if ((e.target as ServiceWorker).state === 'activated') {
                            clearTimeout(timeout)
                            resolve()
                        }
                    })
                })
            }

            try {
                await waitForActive(registration)
                console.log('Service Worker Active & Ready.')
            } catch (e) {
                console.warn('SW activation wait failed, trying to proceed anyway:', e)
            }

            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
            console.log('VAPID Key present:', !!vapidPublicKey)

            if (!vapidPublicKey) {
                throw new Error('Missing VAPID Public Key')
            }

            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

            // Request permission explicitly first to ensure native prompt
            console.log('Requesting Permission...')
            const permissionResult = await Notification.requestPermission()
            console.log('Permission Result:', permissionResult)
            if (permissionResult !== 'granted') {
                throw new Error('Permission not granted')
            }

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

            return { success: true }
        } catch (error: any) {
            console.error('Failed to subscribe', error)
            return { success: false, error: error.message || 'Unknown error' }
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

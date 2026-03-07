import { useState, useEffect } from 'react'
import { urlBase64ToUint8Array } from '@/lib/utils'
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { useRouter } from 'next/navigation'

export function usePushNotifications(appType: 'OPS' | 'LOYALTY' | 'CLIENT' | 'RPS', userIdOrCustomerId: string | null) {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (Capacitor.isNativePlatform()) {
                initCapacitorPush()
            } else if ('serviceWorker' in navigator && 'PushManager' in window) {
                setPermission(Notification.permission)
                registerServiceWorker()
            }
        }
    }, [userIdOrCustomerId])

    const initCapacitorPush = async () => {
        if (!userIdOrCustomerId) return; // Wait until we know who is logged in

        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            setPermission('denied')
            return;
        }

        setPermission('granted')

        PushNotifications.addListener('registration', async (token: Token) => {
            console.log('Push registration success, token: ' + token.value);
            // Send token to our server
            try {
                await fetch('/api/users/device-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: token.value,
                        platform: Capacitor.getPlatform(),
                        appType: appType,
                        userId: appType === 'OPS' ? userIdOrCustomerId : undefined,
                        customerId: appType === 'LOYALTY' ? userIdOrCustomerId : undefined,
                        globalPromoterId: appType === 'RPS' ? userIdOrCustomerId : undefined
                    })
                });
            } catch (err) {
                console.error("Failed to send native push token to server", err)
            }
        });

        PushNotifications.addListener('registrationError', (error: any) => {
            console.error('Error on native push registration: ' + JSON.stringify(error));
        });

        try {
            await PushNotifications.register();
        } catch (error) {
            console.error('Failed to call PushNotifications.register(): ', error);
        }

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Native Push received: ' + JSON.stringify(notification));
            // Show toast or local alert if needed
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
            console.log('Native Push action performed: ' + JSON.stringify(notification));
            // Deep Linking Handler
            const route = notification.notification.data.route;
            if (route) {
                router.push(route);
            }
        });
    }

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            })
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)

            if (sub && userIdOrCustomerId) {
                await saveWebSubscription(sub)
            }
        } catch (error) {
            console.error('Service Worker registration failed:', error)
        }
    }

    const askPermission = async () => {
        if (Capacitor.isNativePlatform()) {
            initCapacitorPush()
        } else {
            const result = await Notification.requestPermission()
            setPermission(result)
            if (result === 'granted' && userIdOrCustomerId) {
                await subscribeUserWeb()
            }
        }
    }

    const subscribeUserWeb = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            })
            setSubscription(sub)
            await saveWebSubscription(sub)
            return sub
        } catch (error) {
            console.error('Failed to subscribe to web push:', error)
        }
    }

    const saveWebSubscription = async (sub: PushSubscription) => {
        // Legacy Web Push config (Optional: refactor to use the new DeviceToken schema)
        await fetch('/api/notifications/subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...sub.toJSON(),
                globalPromoterId: appType === 'RPS' ? userIdOrCustomerId : undefined
            })
        })
    }

    return { permission, askPermission, subscription }
}

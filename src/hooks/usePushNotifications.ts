import { useState, useEffect } from 'react'
import { urlBase64ToUint8Array } from '@/lib/utils'
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications'
import { FCM } from '@capacitor-community/fcm'
import { Capacitor } from '@capacitor/core'
import { useRouter } from 'next/navigation'

export function usePushNotifications(appType: 'OPS' | 'LOYALTY' | 'CLIENT' | 'RPS', userIdOrCustomerId: string | null, memberId?: string | null) {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const router = useRouter()

    const hasAnyId = !!(userIdOrCustomerId || memberId);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (hasAnyId) {
                if (Capacitor.isNativePlatform()) {
                    initCapacitorPush()
                } else if ('serviceWorker' in navigator && 'PushManager' in window) {
                    setPermission(Notification.permission)
                    registerServiceWorker()
                }
            }
        }
    }, [userIdOrCustomerId, memberId])

    const initCapacitorPush = async () => {
        if (!hasAnyId) return;

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
            console.log('APNs registration success, token: ' + token.value);
            
            let fcmToken = token.value;
            
            // On iOS, we need the FCM token, not the APNs token
            if (Capacitor.getPlatform() === 'ios') {
                try {
                    const result = await FCM.getToken();
                    fcmToken = result.token;
                    console.log('FCM token obtained: ' + fcmToken);
                } catch (err) {
                    console.error("Failed to get FCM token, falling back to APNs token", err)
                }
            }

            // Send token to our server
            try {
                await fetch('/api/users/device-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: fcmToken,
                        platform: Capacitor.getPlatform(),
                        appType: appType,
                        userId: appType === 'OPS' ? userIdOrCustomerId : undefined,
                        memberId: appType === 'OPS' ? memberId : undefined,
                        customerId: appType === 'LOYALTY' ? userIdOrCustomerId : undefined,
                        globalPromoterId: appType === 'RPS' ? userIdOrCustomerId : undefined
                    })
                });
            } catch (err) {
                console.error("Failed to send push token to server", err)
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
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
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

            if (sub && (userIdOrCustomerId || memberId)) {
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
            if (result === 'granted' && hasAnyId) {
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


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
// Firebase Admin Setup
import * as admin from 'firebase-admin'

if (!admin.apps.length) {
    try {
        if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                })
            });
            console.log('[FIREBASE] Admin API Initialized');
        } else {
            console.warn('[FIREBASE] Missing Firebase Auth Credentials in .env');
        }
    } catch (e) {
        console.error('[FIREBASE_INIT_ERROR]', e);
    }
}

export async function sendPushNotification(userId: string, payload: PushPayload) {
    try {
        // --- 1. WEB PUSH NOTIFICATIONS (PWA) ---
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

        // --- 2. NATIVE PUSH NOTIFICATIONS (FCM) ---
        if (!admin.apps.length) return; // Skip if Firebase is not initialized

        const deviceTokens = await prisma.deviceToken.findMany({
            where: { userId, isActive: true },
            select: { token: true, id: true }
        });

        if (deviceTokens.length > 0) {
            const tokens = deviceTokens.map(dt => dt.token);

            const message = {
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: {
                    url: payload.url || '',
                },
                tokens: tokens,
                // APNs specific settings for iOS
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                },
                // Android specific settings
                android: {
                    notification: {
                        sound: 'default'
                    }
                }
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            // Clean up invalid native tokens
            if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const errorCode = resp.error?.code;
                        if (errorCode === 'messaging/invalid-registration-token' ||
                            errorCode === 'messaging/registration-token-not-registered') {
                            failedTokens.push(tokens[idx]);
                        }
                    }
                });

                if (failedTokens.length > 0) {
                    await prisma.deviceToken.updateMany({
                        where: { token: { in: failedTokens } },
                        data: { isActive: false }
                    });
                    console.log(`[FCM] Deactivated ${failedTokens.length} invalid tokens.`);
                }
            }
        }

    } catch (error) {
        console.error('Error sending push:', error)
    }
}

export async function sendPushNotificationToRP(globalPromoterId: string, payload: PushPayload) {
    try {
        // --- 1. WEB PUSH NOTIFICATIONS (PWA) ---
        const subscriptions = await (prisma as any).pushSubscription.findMany({
            where: { globalPromoterId }
        })

        if (subscriptions.length > 0) {
            const notifications = subscriptions.map((sub: any) => {
                return webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: sub.keys as any
                    },
                    JSON.stringify(payload)
                ).catch(async (err) => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await (prisma as any).pushSubscription.delete({ where: { id: sub.id } })
                    }
                    console.error('Push error:', err)
                })
            })
            await Promise.all(notifications)
        }

        // --- 2. NATIVE PUSH NOTIFICATIONS (FCM) ---
        if (!admin.apps.length) return; // Skip if Firebase is not initialized

        const deviceTokens = await (prisma as any).deviceToken.findMany({
            where: { globalPromoterId, isActive: true },
            select: { token: true, id: true }
        });

        if (deviceTokens.length > 0) {
            const tokens = deviceTokens.map((dt: any) => dt.token);

            const message = {
                notification: {
                    title: payload.title,
                    body: payload.body,
                },
                data: {
                    url: payload.url || '',
                },
                tokens: tokens,
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                },
                android: {
                    notification: {
                        sound: 'default'
                    }
                }
            };

            const response = await admin.messaging().sendEachForMulticast(message);

            if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const errorCode = resp.error?.code;
                        if (errorCode === 'messaging/invalid-registration-token' ||
                            errorCode === 'messaging/registration-token-not-registered') {
                            failedTokens.push(tokens[idx]);
                        }
                    }
                });

                if (failedTokens.length > 0) {
                    await (prisma as any).deviceToken.updateMany({
                        where: { token: { in: failedTokens } },
                        data: { isActive: false }
                    });
                    console.log(`[FCM] Deactivated ${failedTokens.length} invalid tokens for RP.`);
                }
            }
        }

    } catch (error) {
        console.error('Error sending push to RP:', error)
    }
}

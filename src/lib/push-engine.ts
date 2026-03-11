import { prisma } from '@/lib/prisma';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (Only once)
if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Replace escaped literal \n with actual newlines
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

export type AppType = "OPS" | "LOYALTY" | "CLIENT";

export interface PushMessageParams {
    title: string;
    body: string;
    appType: AppType;
    userId?: string; // For Staff/Owner (Ops App)
    customerId?: string; // For Customers (Loyalty App)
    programId?: string; // If related to a specific loyalty program
    campaignId?: string; // If triggered by a mass campaign
    route?: string; // Deep link route (e.g. /dashboard/chat/123)
    extraData?: Record<string, string>;
}

export async function sendNativePush(params: PushMessageParams) {
    try {
        const { title, body, appType, userId, customerId, programId, campaignId, route, extraData } = params;

        // 1. Validate Target
        if (!userId && !customerId) {
            console.error("[PUSH ENGINE] No target specified (userId or customerId missing).");
            return { success: false, error: "No target specified" };
        }

        // 2. Fetch Device Tokens
        const tokens = await prisma.deviceToken.findMany({
            where: {
                appType,
                isActive: true,
                ...(userId ? { userId } : {}),
                ...(customerId ? { customerId } : {}),
            }
        });

        if (tokens.length === 0) {
            console.log(`[PUSH ENGINE] No active tokens found for ${userId || customerId} in app ${appType}`);
            return { success: false, message: "No active tokens" };
        }

        const fcmTokens = tokens.map(t => t.token);

        // 3. Prepare Payload
        const messagePayload: admin.messaging.MulticastMessage = {
            tokens: fcmTokens,
            notification: {
                title,
                body,
            },
            data: {
                // Must be strings
                appType,
                ...(route ? { route } : {}),
                ...(programId ? { programId } : {}),
                ...(campaignId ? { campaignId } : {}),
                ...extraData
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: 'FCM_PLUGIN_ACTIVITY', // Required for Capacitor deep linking
                }
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    }
                }
            }
        };

        // 4. Send using FCM
        // Even for iOS, Firebase handles the APNs routing if configured in Firebase Console
        const response = await admin.messaging().sendEachForMulticast(messagePayload);

        console.log(`[PUSH ENGINE] Sent ${response.successCount} messages. Failed: ${response.failureCount}`);

        // 5. Clean up invalid tokens
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const errorCode = resp.error?.code;
                    // These errors mean the token is no longer valid
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered') {
                        failedTokens.push(fcmTokens[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                await prisma.deviceToken.updateMany({
                    where: { token: { in: failedTokens } },
                    data: { isActive: false }
                });
                console.log(`[PUSH ENGINE] Deactivated ${failedTokens.length} invalid tokens.`);
            }
        }

        // 6. Log Analytics to Database
        await prisma.notificationLog.create({
            data: {
                title,
                body,
                appType,
                programId,
                customerId,
                userId,
                campaignId,
                status: response.successCount > 0 ? "DELIVERED" : "FAILED",
                metadata: {
                    successCount: response.successCount,
                    failureCount: response.failureCount,
                    route
                }
            }
        });

        return { success: true, delivered: response.successCount };

    } catch (error) {
        console.error("[PUSH ENGINE] Unexpected Error:", error);
        return { success: false, error: "Push Engine Exception" };
    }
}

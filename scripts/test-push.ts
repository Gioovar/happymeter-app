import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environmental variables from .env
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function main() {
    console.log("Sending test push to all devices...");

    const prisma = new PrismaClient();

    const tokens = await prisma.deviceToken.findMany({
        where: { isActive: true }
    });

    if (tokens.length === 0) {
        console.log("No active tokens found in DB.");
        return;
    }

    console.log(`Found ${tokens.length} tokens. Init Firebase...`);

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    }

    const messagePayload: admin.messaging.MulticastMessage = {
        tokens: tokens.map(t => t.token),
        notification: {
            title: "¡Prueba de HappyMeters!",
            body: "🚀 Las notificaciones nativas en tu iOS/Android ya funcionan.",
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1
                }
            }
        },
        android: {
            priority: 'high'
        }
    };

    const response = await admin.messaging().sendEachForMulticast(messagePayload);
    console.log(`Sent: ${response.successCount}, Failed: ${response.failureCount}`);

    if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                console.error(`Failed token ${idx}:`, resp.error);
            }
        });
    }
}

main().catch(console.error);

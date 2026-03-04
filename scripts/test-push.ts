import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
    console.log("Sending test push to all LOYALTY apps...");

    const prisma = new PrismaClient();

    const tokens = await prisma.deviceToken.findMany({
        where: { appType: 'LOYALTY' }
    });

    if (tokens.length === 0) {
        console.log("No LOYALTY tokens found in DB.");
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
            body: "🚀 Las notificaciones nativas en Android ya funcionan.",
        },
        android: {
            priority: 'high'
        }
    };

    const response = await admin.messaging().sendEachForMulticast(messagePayload);
    console.log(`Sent: ${response.successCount}, Failed: ${response.failureCount}`);
}

main().catch(console.error);

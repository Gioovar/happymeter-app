import { PrismaClient } from '@prisma/client';
import * as adminNamespace from 'firebase-admin';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

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

    let admin = adminNamespace;
    if (!admin.apps) {
        // Fallback for ESM resolution
        admin = (adminNamespace as any).default || adminNamespace;
    }

    if (!admin.apps || !admin.apps.length) {
        const rawdata = readFileSync(resolve(process.cwd(), 'firebase-service-account.json'), 'utf8');
        const serviceAccount = JSON.parse(rawdata);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }

    const messagePayload = {
        tokens: tokens.map((t: any) => t.token),
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
            priority: 'high' as const
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

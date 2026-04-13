import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function sendTestPush() {
    console.log('--- Final Push Test ---');

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !rawKey) {
        console.error('Credentials missing in .env');
        return;
    }

    // Scrub the key from any wrapping quotes or escaped newlines
    const privateKey = rawKey.replace(/^"(.*)"$/, '$1').replace(/\\n/g, '\n');

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            })
        });
    }

    const latest = await prisma.deviceToken.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
    });

    if (!latest) {
        console.error('No active token found');
        return;
    }

    console.log(`Targeting: ${latest.token.substring(0, 15)}...`);

    const message = {
        token: latest.token,
        notification: {
            title: '¡Happy OPS Test! 🔔',
            body: 'Si recibes esto y vibra, estamos listos para App Store.',
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                    // Critical for vibration/pre-emption on iOS
                    'mutable-content': 1
                }
            }
        }
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error: any) {
        console.error('Error Details:', error.code, error.message);
    } finally {
        await prisma.$disconnect();
    }
}

sendTestPush();

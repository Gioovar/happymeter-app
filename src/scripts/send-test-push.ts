import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function sendTestPush() {
    console.log('--- Starting Global Push Notification Test ---');

    // 1. Initialize Firebase
    if (!admin.apps.length) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY 
            ? process.env.FIREBASE_PRIVATE_KEY.split('\\n').join('\n') 
            : undefined;

        if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
            console.error('Missing Firebase credentials in .env');
            process.exit(1);
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            })
        });
        console.log('Firebase Admin SDK Initialized');
    }

    // 2. Find the most recent active tokens (Last 30 mins)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const tokens = await prisma.deviceToken.findMany({
        where: { 
            isActive: true,
            createdAt: { gte: thirtyMinsAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    if (tokens.length === 0) {
        console.warn('No tokens found in last 30 minutes. Falling back to latest 5 global tokens.');
        const fallbackTokens = await prisma.deviceToken.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        tokens.push(...fallbackTokens);
    }

    if (tokens.length === 0) {
        console.error('No active device tokens found in the database.');
        process.exit(1);
    }

    console.log(`Sending to ${tokens.length} tokens...`);

    // 3. Construct Payload
    const message = {
        notification: {
            title: '¡Happy Test! 🔔',
            body: 'Esta es una prueba de vibración y sonido. ¡Si vibra, estamos listos!',
        },
        data: {
          url: '/ops/tasks'
        },
        tokens: tokens.map(t => t.token),
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

    // 4. Send
    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`Successfully sent: ${response.successCount} messages. Failed: ${response.failureCount}`);
        
        if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`Token ${idx} failure:`, resp.error?.code, resp.error?.message);
                }
            });
        }
        console.log('SUCCESS: Notifications dispatched.');
    } catch (error) {
        console.error('Error sending message:', error);
    } finally {
        await prisma.$disconnect();
    }
}

sendTestPush();

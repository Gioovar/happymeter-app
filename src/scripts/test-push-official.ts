import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');

async function sendTestPush() {
    console.log('--- Official Push Notification Test ---');

    // 1. Initialize Firebase using the JSON file
    if (!admin.apps.length) {
        if (!fs.existsSync(serviceAccountPath)) {
            console.error('firebase-service-account.json not found!');
            process.exit(1);
        }

        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK Initialized with Service Account JSON');
    }

    // 2. Find the most recent active token
    const latestToken = await prisma.deviceToken.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
    });

    if (!latestToken) {
        console.error('No active device tokens found.');
        process.exit(1);
    }

    console.log(`Targeting Token: ${latestToken.token.substring(0, 15)}...`);
    console.log(`User/Member ID: ${latestToken.userId || latestToken.memberId}`);

    // 3. Construct Payload
    const message = {
        notification: {
            title: '¡Prueba Happy OPS! 🚀',
            body: 'Esta notificación debe hacer vibrar tu celular (Build 22).',
        },
        data: {
          url: '/ops/tasks'
        },
        token: latestToken.token,
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                    "content-available": 1
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
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        console.log('SUCCESS: The notification was sent successfully!');
    } catch (error) {
        console.error('Error sending message:', error);
    } finally {
        await prisma.$disconnect();
    }
}

sendTestPush();

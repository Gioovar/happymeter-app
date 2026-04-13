import { PrismaClient } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

// Manually initialize Firebase to ensure it works in this script
if (!admin.apps.length) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
        privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    const finalKey = privateKey?.split('\\n').join('\n');

    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: finalKey,
        }),
    });
}

async function runTest() {
    console.log('Searching for latest token...');
    const latestToken = await prisma.deviceToken.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
    });

    if (!latestToken) {
        console.error('No token found');
        return;
    }

    console.log(`Sending to token: ${latestToken.token.substring(0, 10)}... (Created: ${latestToken.createdAt})`);

    const message = {
        token: latestToken.token,
        notification: {
            title: '¡Prueba Happy OPS! 🚀',
            body: 'Si recibes esto y vibra, las notificaciones están listas para producción.',
        },
        data: {
          route: '/ops/tasks'
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: 1,
                }
            }
        },
        android: {
            notification: {
                sound: 'default'
            }
        }
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
    } catch (error) {
        console.error('Error sending message:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();

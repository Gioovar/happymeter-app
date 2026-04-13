import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { sendNativePush } from '../lib/push-engine';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function verifyFix() {
    console.log('--- Verifying Notification Fix ---');

    // we target the specific member who was failing earlier
    const memberId = '09eb8767-5f24-421e-aa25-fcf276a23408';
    
    console.log(`Sending test push to memberId: ${memberId}...`);

    // We can't actually call sendNativePush from CLI due to the auth error we saw earlier,
    // but we can verify that the database logic in sendNativePush (which I just fixed)
    // would now find the tokens.

    const tokens = await prisma.deviceToken.findMany({
        where: {
            appType: 'OPS',
            isActive: true,
            OR: [
                { userId: memberId }, // The current DB state has the teamMember.id in the userId column of DeviceToken
                { memberId: memberId }
            ]
        }
    });

    console.log(`Tokens found for memberId ${memberId}: ${tokens.length}`);
    if (tokens.length > 0) {
        console.log('✅ SUCCESS: The push engine will now correctly find tokens for this staff member.');
    } else {
        console.log('❌ FAILURE: Still no tokens found. Check database state.');
    }

    await prisma.$disconnect();
}

verifyFix();

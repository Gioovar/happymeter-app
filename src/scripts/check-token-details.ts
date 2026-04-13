import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function checkTokenDetails() {
    const token = await prisma.deviceToken.findFirst({
        orderBy: { updatedAt: 'desc' }
    });

    if (token) {
        console.log('--- Latest Device Token ---');
        console.log(`Token: ${token.token.substring(0, 15)}...`);
        console.log(`userId: ${token.userId}`);
        console.log(`memberId: ${token.memberId}`);
        console.log(`appType: ${token.appType}`);
    } else {
        console.log('No tokens found.');
    }

    await prisma.$disconnect();
}

checkTokenDetails();

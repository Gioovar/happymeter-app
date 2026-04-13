import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function checkLogs() {
    console.log('--- Checking Notification Logs ---');
    const logs = await prisma.notificationLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });

    if (logs.length === 0) {
        console.log('No notification logs found.');
    } else {
        logs.forEach(log => {
            console.log(`[${log.createdAt.toISOString()}] ${log.title}: ${log.status}`);
            console.log(`Metadata: ${JSON.stringify(log.metadata)}`);
            console.log('---');
        });
    }

    console.log('--- Checking Latest Device Tokens ---');
    const tokens = await prisma.deviceToken.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { userId: true, memberId: true, appType: true, platform: true, updatedAt: true, isActive: true }
    });
    
    tokens.forEach(t => {
        console.log(`User: ${t.userId || t.memberId} | App: ${t.appType} | Platform: ${t.platform} | Updated: ${t.updatedAt.toISOString()} | Active: ${t.isActive}`);
    });

    await prisma.$disconnect();
}

checkLogs();

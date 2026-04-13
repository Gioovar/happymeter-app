import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function checkAssignment() {
    console.log('--- Checking Latest Task Assignment ---');
    
    // 1. Get the most recently updated task
    const task = await prisma.processTask.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: { zone: true }
    });

    if (!task) {
        console.log('No tasks found.');
        return;
    }

    console.log(`Task Found: "${task.title}" (ID: ${task.id})`);
    console.log(`Assigned Staff ID: ${task.assignedStaffId}`);
    console.log(`Updated at: ${task.updatedAt.toISOString()}`);

    // 2. Resolve Staff
    if (task.assignedStaffId) {
        const staff = await prisma.teamMember.findUnique({
            where: { id: task.assignedStaffId }
        });

        if (staff) {
            console.log(`Staff Member Found: "${staff.name}"`);
            console.log(`Staff UserID: ${staff.userId}`);
            
            if (!staff.userId) {
                console.warn('CRITICAL: This staff member has no userId linked! Push notification cannot be sent.');
            } else {
                // 3. Check for tokens for this userId
                const tokens = await prisma.deviceToken.findMany({
                    where: { userId: staff.userId, isActive: true }
                });
                console.log(`Active tokens for this userId: ${tokens.length}`);
            }
        } else {
            console.error('Staff ID exists but TeamMember record not found!');
        }
    } else {
        console.log('Task is not assigned to any specific staff member.');
    }

    await prisma.$disconnect();
}

checkAssignment();

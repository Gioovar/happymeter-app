
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Cleaning pending invitations...');
        // Delete team members with status 'INVITED' (which are the pending ones)
        const result = await prisma.teamMember.deleteMany({
            where: {
                status: 'INVITED'
            }
        });
        console.log(`Deleted ${result.count} pending invitations.`);
    } catch (e) {
        console.error('Error cleaning invitations:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

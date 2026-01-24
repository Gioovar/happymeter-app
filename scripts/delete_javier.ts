
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
    console.log('--- Searching Users to Delete (Targeted) ---');

    // Search by Email
    const byEmail = await clerk.users.getUserList({ emailAddress: ['gtrendy2009@hotmail.com'] });
    console.log(`By Email matched: ${byEmail.data.length}`);

    // Search by Query (Name)
    const byQuery = await clerk.users.getUserList({ query: 'Javier' });
    console.log(`By Query 'Javier' matched: ${byQuery.data.length}`);

    const allMatches = [...byEmail.data, ...byQuery.data];

    // Dedup by ID
    const map = new Map();
    for (const u of allMatches) {
        map.set(u.id, u);
    }

    const usersToDelete = [];
    for (const user of map.values()) {
        const email = user.emailAddresses[0]?.emailAddress;
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        console.log(`Target found: ${name} (${email}) - ${user.id}`);
        usersToDelete.push(user.id);
    }

    if (usersToDelete.length === 0) {
        console.log('No users found.');
        // LIST ALL RECENT USERS TO DEBUG THE "14" COUNT
        console.log('--- DEBUG: Listing last 20 users to diagnose ---');
        const recent = await clerk.users.getUserList({ limit: 20, orderBy: '-created_at' });
        recent.data.forEach(u => {
            console.log(`[${u.id}] ${u.firstName} ${u.lastName} (${u.emailAddresses[0]?.emailAddress})`);
        });
        return;
    }

    console.log(`Found ${usersToDelete.length} users to delete.`);

    for (const userId of usersToDelete) {
        console.log(`Deleting ${userId}...`);

        // 1. Delete from Clerk
        try {
            await clerk.users.deleteUser(userId);
            console.log(`- Deleted from Clerk`);
        } catch (e: any) {
            console.error(`- Failed to delete from Clerk: ${e.message}`);
        }

        // 2. Delete from Prisma
        try {
            await prisma.userSettings.deleteMany({ where: { userId } });
            await prisma.survey.deleteMany({ where: { userId } });
            await prisma.sale.deleteMany({ where: { userId } });
            // Note: Sale deletion fixes the financial metrics too if linked to user
            console.log(`- Deleted from Database`);
        } catch (e: any) {
            console.error(`- Failed to delete from DB: ${e.message}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

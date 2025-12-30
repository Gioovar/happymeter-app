
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function main() {
    const email = 'roykch85@gmail.com';
    const oldId = 'user_37XJ8NZWuXL5ueSJ6Psk0NZ5BEE';
    console.log(`Searching for ${email}...`);

    let userId = oldId;
    let foundInClerk = false;

    try {
        const list = await clerk.users.getUserList({ emailAddress: [email] });
        if (list.data.length > 0) {
            userId = list.data[0].id;
            console.log(`✅ User found in Clerk: ${userId} (${list.data[0].firstName})`);
            foundInClerk = true;
        } else {
            console.log(`❌ User NOT found in Clerk by email. Using provided ID: ${oldId}`);
            // If not in Clerk, we might be operating on a local DB record only, or the ID is correct and Clerk search failed?
            // We will proceed with the ID provided by the user, assuming it might be valid or restored.
        }
    } catch (e) {
        console.error("Clerk lookup failed:", e);
    }

    console.log(`Updating UserSettings for ${userId}...`);
    // 1. Assign Plan
    await prisma.userSettings.upsert({
        where: { userId },
        update: {
            plan: 'GROWTH', // Assuming "Rumores" bought Growth/Pro
            subscriptionStatus: 'active',
            businessName: 'Rumores',
            isOnboarded: true
        },
        create: {
            userId,
            plan: 'GROWTH',
            subscriptionStatus: 'active',
            businessName: 'Rumores',
            isOnboarded: true
        }
    });

    // 2. Assign Sale
    const saleExists = await prisma.sale.findFirst({ where: { userId, amount: 499 } });
    if (!saleExists) {
        console.log('Restoring $499 Sale...');
        await prisma.sale.create({
            data: {
                userId,
                amount: 499,
                currency: 'mxn',
                plan: 'GROWTH_MONTHLY',
                status: 'COMPLETED',
                createdAt: new Date() // Or keep it recent
            }
        });
    } else {
        console.log('Sale record already exists.');
    }

    // 3. Remove "Placeholder" if it exists (user_client_restaurante_01)
    // to avoid duplicate revenue in dashboard
    try {
        await prisma.userSettings.delete({ where: { userId: 'user_client_restaurante_01' } });
        await prisma.sale.deleteMany({ where: { userId: 'user_client_restaurante_01' } });
        console.log('Cleaned up placeholder data.');
    } catch (e) {
        // Ignore if does not exist
    }

    console.log('✅ Plan assigned successfully.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());


import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- UPDATING ROGELIO PLACEHOLDER ---');

    const placeholderId = 'user_client_restaurante_01';

    // 1. Update UserSettings to look like Rogelio
    // Note: UserSettings doesn't hold Name/Email usually (Clerk does), but some Admin views might join or look up profiles.
    // If the Admin Table fetches from Clerk, it won't find this ID.
    // BUT the "Ventas" table often uses local data if modeled that way, or fails gracefully.
    // Let's ensure UserSettings has BusinessName or similar that might appear.

    await prisma.userSettings.upsert({
        where: { userId: placeholderId },
        update: {
            businessName: 'Rogelio Gonzáles (Restaurado)',
            plan: 'GROWTH',
            subscriptionStatus: 'active'
        },
        create: {
            userId: placeholderId,
            businessName: 'Rogelio Gonzáles (Restaurado)',
            plan: 'GROWTH',
            subscriptionStatus: 'active'
        }
    });

    // 2. Ensure Sale is linked to this ID
    // I created it in restore_data.ts, but let's double check/update
    const sale = await prisma.sale.findFirst({
        where: { userId: placeholderId }
    });

    if (sale) {
        console.log(`Sale found for Rogelio placeholder: $${sale.amount} ${sale.currency}`);
    } else {
        console.log('Creating Sale for Rogelio...');
        await prisma.sale.create({
            data: {
                userId: placeholderId,
                amount: 499,
                currency: 'mxn',
                plan: 'GROWTH_MONTHLY',
                status: 'COMPLETED'
            }
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

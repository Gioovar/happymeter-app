import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- Checking User Plans ---');
    const paidUsers = await prisma.userSettings.findMany({
        where: {
            plan: { not: 'FREE' }
        },
        select: { userId: true, plan: true, subscriptionStatus: true }
    });
    console.log(`Paid Users Found: ${paidUsers.length}`);
    console.log(paidUsers);

    console.log('\n--- Checking Sales Records ---');
    const sales = await prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log(`Total Sales Found: ${await prisma.sale.count()}`);
    console.log('Recent Sales:', sales);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- Auditing Sales ---');
    const sales = await prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
    });

    console.log(`Total Sales in DB: ${sales.length}`);
    sales.forEach(s => {
        console.log(`ID: ${s.id} | Amount: ${s.amount} | Currency: ${s.currency} | Date: ${s.createdAt} | User: ${s.userId}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- Cleaning Orphaned Sales ---');

    const deleted = await prisma.sale.deleteMany({
        where: {
            userId: { startsWith: 'user_smoke' }
        }
    });

    console.log(`Deleted ${deleted.count} orphaned sales.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- Cleaning Up Test Data ---');

    // 1. Delete SMOKE Commissions
    const deletedCommissions = await prisma.commission.deleteMany({
        where: {
            description: { contains: 'Smoke Test' }
        }
    });
    console.log(`Deleted ${deletedCommissions.count} SMOKE commissions.`);

    // 2. Delete SMOKE Users (if they have 'smoke' in userId or email)
    const smokeUsers = await prisma.userSettings.findMany({
        where: {
            userId: { contains: 'smoke' }
        }
    });
    console.log(`Found ${smokeUsers.length} SMOKE users.`);

    // CAUTION: Deleting users cascades to many tables.
    const deletedUsers = await prisma.userSettings.deleteMany({
        where: {
            userId: { contains: 'smoke' }
        }
    });
    console.log(`Deleted ${deletedUsers.count} SMOKE users.`);

    // 3. Clean any affiliates with 'SMOKE_REF' code
    const deletedAffiliates = await prisma.affiliateProfile.deleteMany({
        where: {
            code: 'SMOKE_REF'
        }
    })
    console.log(`Deleted ${deletedAffiliates.count} SMOKE affiliates.`);

}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

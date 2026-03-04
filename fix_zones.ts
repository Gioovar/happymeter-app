import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fixing missing branchIds on ProcessZones...");

    // Any zone where branchId is null, but userId is actually a branch, should be updated.
    const zonesToFix = await prisma.processZone.findMany({
        where: { branchId: null },
        include: {
            // Check if this userId is actually a branch
            branch: true,
            user: { select: { businessName: true } }
        }
    });

    console.log(`Found ${zonesToFix.length} zones with null branchId.`);

    let fixedCount = 0;
    for (const zone of zonesToFix) {
        // If the userId matches a known branch in UserSettings
        const isBranch = await prisma.userSettings.findUnique({
            where: { userId: zone.userId }
        });

        if (isBranch) {
            await prisma.processZone.update({
                where: { id: zone.id },
                data: { branchId: zone.userId }
            });
            console.log(`Fixed zone: ${zone.name} (${zone.id}) -> Set branchId to: ${zone.userId}`);
            fixedCount++;
        }
    }

    console.log(`Finished fixing ${fixedCount} ProcessZone records.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

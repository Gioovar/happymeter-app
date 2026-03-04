import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Looking up La Santi Portales...");
    const branch = await prisma.userSettings.findFirst({
        where: { businessName: { contains: "portales", mode: "insensitive" } },
        select: { userId: true, businessName: true }
    });

    console.log("Branch:", branch);

    if (branch) {
        console.log("\nLooking up zones for this branch id...");
        const zones = await prisma.processZone.findMany({
            where: {
                OR: [
                    { userId: branch.userId },
                    { branchId: branch.userId }
                ]
            },
            include: { user: { select: { businessName: true } }, branch: { select: { businessName: true } } }
        });

        console.log(`Found ${zones.length} zones.`);
        console.log(JSON.stringify(zones, null, 2));
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Looking up all zones with 'puerta' in the name...");
    const zones = await prisma.processZone.findMany({
        where: { name: { contains: "puerta", mode: "insensitive" } },
        include: { user: { select: { businessName: true } }, branch: { select: { businessName: true } } }
    });

    console.log(`Found ${zones.length} zones.`);
    console.log(JSON.stringify(zones, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching latest zones...");
    const zones = await prisma.processZone.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { businessName: true, email: true } }, branch: { select: { businessName: true } } }
    });

    console.log(JSON.stringify(zones, null, 2));

    console.log("Fetching user/branch La Santi Portales...");
    const branch = await prisma.userSettings.findFirst({
        where: {
            businessName: { contains: "portales", mode: "insensitive" }
        }
    });

    console.log("Branch:", branch?.userId, branch?.businessName);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

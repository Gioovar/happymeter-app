import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Looking up employees for La Santi Vertiz...");

    // Find "La Santi Vertiz" UserSettings ID
    const vertiz = await prisma.userSettings.findFirst({
        where: { businessName: { contains: "vertiz", mode: "insensitive" } },
        select: { userId: true, businessName: true }
    });

    if (!vertiz) {
        throw new Error("Could not find La Santi Vertiz");
    }

    console.log(`Vertiz branch ID: ${vertiz.userId}`);

    const members = await prisma.teamMember.findMany({
        where: { ownerId: vertiz.userId }
    });

    console.log(`Found ${members.length} employees directly under Vertiz.`);
    if (members.length > 0) {
        console.log(JSON.stringify(members, null, 2));
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

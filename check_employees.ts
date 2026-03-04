import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Looking up employees for La Santi Portales...");

    // Find "La Santi Portales" UserSettings ID
    const portales = await prisma.userSettings.findFirst({
        where: { businessName: { contains: "portales", mode: "insensitive" } },
        select: { userId: true, businessName: true }
    });

    if (!portales) {
        throw new Error("Could not find La Santi Portales");
    }

    console.log(`Portales branch ID: ${portales.userId}`);

    const members = await prisma.teamMember.findMany({
        where: { ownerId: portales.userId }
    });

    console.log(`Found ${members.length} employees directly under Portales.`);
    console.log(JSON.stringify(members, null, 2));

    // Also check the main "La Santi Lab" account just in case
    const lab = await prisma.userSettings.findFirst({
        where: { businessName: { contains: "lab", mode: "insensitive" } },
        select: { userId: true, businessName: true }
    });

    if (lab) {
        const labMembers = await prisma.teamMember.findMany({
            where: { ownerId: lab.userId }
        });
        console.log(`\nFound ${labMembers.length} employees directly under La Santi Lab.`);
        console.log(JSON.stringify(labMembers, null, 2));
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

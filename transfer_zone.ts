import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Transferring 'Puerta y Calle' to 'La Santi Portales'...");

    // Find "La Santi Portales" UserSettings ID
    const portales = await prisma.userSettings.findFirst({
        where: { businessName: { contains: "portales", mode: "insensitive" } },
        select: { userId: true, businessName: true }
    });

    if (!portales) {
        throw new Error("Could not find La Santi Portales");
    }

    // Find "Puerta y Calle" zone
    const puertaZone = await prisma.processZone.findFirst({
        where: { name: { contains: "puerta", mode: "insensitive" } },
    });

    if (!puertaZone) {
        throw new Error("Could not find Puerta y Calle zone");
    }

    console.log(`Transferring zone ${puertaZone.id} to ${portales.businessName} (${portales.userId})`);

    await prisma.processZone.update({
        where: { id: puertaZone.id },
        data: {
            userId: portales.userId,
            branchId: portales.userId
        }
    });

    console.log("Transfer complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

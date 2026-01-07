import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Get the first user (we assume this is YOU, the admin/owner)
    const user = await prisma.userSettings.findFirst();

    if (!user) {
        console.error("No user found. Please sign up first.");
        return;
    }

    console.log(`Seeding processes for User: ${user.userId}...`);

    // 2. Create Zones
    const zoneKitchen = await prisma.processZone.create({
        data: {
            userId: user.userId,
            name: "Cocina 🍳",
            description: "Área de preparación de alimentos"
        }
    });

    const zoneBar = await prisma.processZone.create({
        data: {
            userId: user.userId,
            name: "Barra 🍹",
            description: "Área de bebidas y atención"
        }
    });

    // 3. Create Tasks
    await prisma.processTask.create({
        data: {
            zoneId: zoneKitchen.id,
            title: "Limpieza de Freidora",
            description: "Filtrar el aceite y limpiar residuos.",
            limitTime: "11:00", // 11 AM deadline
            evidenceType: "PHOTO"
        }
    });

    await prisma.processTask.create({
        data: {
            zoneId: zoneKitchen.id,
            title: "Inventario de Carnes",
            description: "Contar paquetes en congelador.",
            limitTime: "23:00", // 11 PM deadline
            evidenceType: "PHOTO"
        }
    });

    await prisma.processTask.create({
        data: {
            zoneId: zoneBar.id,
            title: "Stock de Hielos",
            description: "Verificar nivel de hielo en máquinas.",
            limitTime: "18:00",
            evidenceType: "PHOTO"
        }
    });

    console.log("✅ Seed completed: 2 Zones, 3 Tasks created.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

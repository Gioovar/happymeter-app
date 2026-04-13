import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('--- DEPURACIÓN DE NOTIFICACIONES ---');
    
    // 1. Buscar usuario por nombre de sucursal
    const branches = await prisma.userSettings.findMany({
        where: { businessName: { contains: 'Metiche', mode: 'insensitive' } }
    });

    if (branches.length === 0) {
        console.log('❌ No se encontró el negocio "La Metiche".');
        return;
    }

    const branch = branches[0];
    const userId = branch.userId;
    console.log(`✅ Negocio encontrado: ${branch.businessName} (ID: ${userId})`);

    // 2. Verificar Tokens de dispositivos
    const tokens = await prisma.deviceToken.findMany({
        where: { userId }
    });

    console.log(`Dispositivos registrados (${tokens.length}):`);
    tokens.forEach(t => {
        console.log(`- Platform: ${t.platform}, App: ${t.appType}, Active: ${t.isActive}, Created: ${t.createdAt}`);
    });

    // 3. Verificar Notificaciones recientes (In-App)
    const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log('\nNotificaciones In-App recientes:');
    notifications.forEach(n => {
        console.log(`- [${n.createdAt}] ${n.title}: ${n.message} (Read: ${n.isRead})`);
    });

    // 4. Verificar InternalNotifications (por si acaso)
    const internal = (await prisma as any).internalNotification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log('\nInternal Notifications recientes:');
    (await internal).forEach((n: any) => {
        console.log(`- [${n.createdAt}] ${n.title}: ${n.body} (Read: ${n.isRead})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

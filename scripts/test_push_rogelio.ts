import { sendPushNotification } from '../src/lib/push-service';
import { prisma } from '../src/lib/prisma';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const userId = 'user_37XJ8NZWuXL5ueSJ6Psk0NZ5BEE'; // ID de Rogelio
    console.log(`Enviando notificación de prueba a: ${userId}...`);

    const payload = {
        title: '🔔 Prueba de Happy OPS',
        body: 'Esta es una notificación de prueba para confirmar que el sistema está listo. 🚀',
        url: '/ops/tasks'
    };

    try {
        await sendPushNotification(userId, payload);
        console.log('✅ Notificación enviada exitosamente.');
    } catch (error) {
        console.error('❌ Error al enviar notificación:', error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

import { prisma } from '../src/lib/prisma';
import { sendPushNotification } from '../src/lib/push-service';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('--- ENVIANDO NOTIFICACIÓN GLOBAL OPS ---');
    
    // 1. Buscar todos los tokens activos de la app OPS
    const tokens = await prisma.deviceToken.findMany({
        where: {
            appType: 'OPS',
            isActive: true
        },
        select: {
            userId: true,
            token: true
        }
    });

    console.log(`Encontrados ${tokens.length} dispositivos activos.`);

    if (tokens.length === 0) {
        console.log('❌ No hay dispositivos registrados para la app OPS.');
        return;
    }

    // 2. Agrupar por userId para usar sendPushNotification o enviarlas una a una
    // Para asegurar que llegue a todos, las enviaremos una por una si tienen userId
    const payload = {
        title: '🚀 Notificación de Review',
        body: 'Confirmación exitosa: Este dispositivo está listo para OPS. ¡Suerte con la revisión!',
        url: '/ops/tasks'
    };

    for (const token of tokens) {
        if (token.userId) {
            console.log(`Enviando a usuario: ${token.userId}...`);
            await sendPushNotification(token.userId, payload);
        } else {
            console.log(`Token sin userId encontrado: ${token.token.substring(0, 10)}...`);
            // Nota: El servicio actual depende de userId para buscar tokens en la DB.
            // Podríamos extenderlo o usar Firebase Admin directamente, pero intentaremos por userId primero.
        }
    }

    console.log('✅ Proceso completado.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

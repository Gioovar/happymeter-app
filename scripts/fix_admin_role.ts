
import { prisma } from '../src/lib/prisma';

async function main() {
    const userId = 'user_36zT5iakWJbn4MQNg76Dvdz4FKa'; // Giovanni Vargas
    console.log(`Checking role for ${userId}...`);

    let settings = await prisma.userSettings.findUnique({
        where: { userId }
    });

    if (!settings) {
        console.log('UserSettings not found! Creating default...');
        // If missing, we create it (though layout does check for it)
        settings = await prisma.userSettings.create({
            data: {
                userId,
                role: 'SUPER_ADMIN', // Force super admin
                plan: 'PRO'
            }
        });
        console.log('Created UserSettings with SUPER_ADMIN role.');
    } else {
        console.log(`Current Role: ${settings.role}`);
        if (settings.role !== 'SUPER_ADMIN') {
            console.log('Promoting to SUPER_ADMIN...');
            await prisma.userSettings.update({
                where: { userId },
                data: { role: 'SUPER_ADMIN' }
            });
            console.log('Promoted successfully.');
        } else {
            console.log('User is already SUPER_ADMIN.');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

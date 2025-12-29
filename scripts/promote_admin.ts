import { prisma } from '../src/lib/prisma';

async function main() {
    const userId = 'user_37SFLGasdoohPrkDVUI05nFppHx'; // gtrendy2017@gmail.com

    const user = await prisma.userSettings.findUnique({
        where: { userId }
    });

    console.log(`User Role: ${user?.role}`);

    if (user && user.role !== 'SUPER_ADMIN') {
        console.log('Promoting to SUPER_ADMIN...');
        await prisma.userSettings.update({
            where: { userId },
            data: { role: 'SUPER_ADMIN' }
        });
        console.log('Done.');
    } else {
        console.log('User is already SUPER_ADMIN or not found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

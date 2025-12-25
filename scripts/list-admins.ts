
import { prisma } from '@/lib/prisma'

async function main() {
    console.log('Searching for admins...')
    const admins = await prisma.userSettings.findMany({
        where: {
            role: { in: ['SUPER_ADMIN', 'ADMIN'] }
        },
        select: {
            id: true,
            userId: true,
            businessName: true,
            role: true,
            createdAt: true
        }
    })
    console.log('Found admins:', JSON.stringify(admins, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

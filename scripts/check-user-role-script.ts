
import { prisma } from '../src/lib/prisma'

async function main() {
    const users = await prisma.userSettings.findMany({
        select: {
            userId: true,
            role: true,
        }
    })
    console.log('User Roles:', users)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

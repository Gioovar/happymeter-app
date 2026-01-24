
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.userSettings.findMany({
        orderBy: { createdAt: 'desc' }
    })

    console.log(`📋 Usuarios encontrados (${users.length}):`)
    users.forEach((u, i) => {
        console.log(`${i + 1}. ID: ${u.userId} | Role: ${u.role} | Created: ${u.createdAt.toISOString()}`)
    })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

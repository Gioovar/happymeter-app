import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.userSettings.findMany({
        select: {
            userId: true,
            businessName: true,
            createdAt: true,
            plan: true,
        }
    })

    console.log('Found users:', users.length)
    users.forEach(u => {
        console.log(`ID: ${u.userId} | Business: ${u.businessName || 'N/A'} | Plan: ${u.plan} | Created: ${u.createdAt}`)
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

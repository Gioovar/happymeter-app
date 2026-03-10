import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const res = await prisma.reservation.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { table: true } })
    console.log("Recent reservations:", res)
}
main().finally(() => prisma.$disconnect())

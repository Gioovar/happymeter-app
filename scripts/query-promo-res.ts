import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const prom = await prisma.promoterProfile.findFirst({
    where: { name: { contains: 'ZOE', mode: 'insensitive' } },
    include: {
      reservations: {
        select: {
          id: true,
          date: true,
          createdAt: true,
          status: true,
          customerName: true
        }
      }
    }
  })
  console.log(JSON.stringify(prom, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())

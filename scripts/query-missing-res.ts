import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const prom = await prisma.promoterProfile.findUnique({ where: { slug: 'zoe20' } })
  console.log("Promoter:", prom?.name, prom?.id, prom?.businessId)

  if (!prom?.businessId) return

  const allRecent = await prisma.reservation.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      userId: prom.businessId
    },
    select: {
      id: true,
      customerName: true,
      date: true,
      promoterId: true
    }
  })

  console.log("Recent reservations for this business:", JSON.stringify(allRecent, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tickets = await prisma.issueTicket.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            businessId: true,
            branchId: true,
            title: true,
            category: true,
        }
    })

    console.log("Recent Tickets:", JSON.stringify(tickets, null, 2))

    // also get the PRUEBAS GABRIEL user or context to check their ID
    const branches = await prisma.userSettings.findMany({
        where: { businessName: { contains: "PRUEBAS GABRIEL" } },
        select: { userId: true, businessName: true }
    })
    console.log("Branches with 'PRUEBAS GABRIEL':", JSON.stringify(branches, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())

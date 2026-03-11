import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const zones = await prisma.processZone.findMany({ select: { id: true, name: true, userId: true, branchId: true } })
    console.log("Zones in DB:")
    console.table(zones)

    const users = await prisma.userSettings.findMany({ select: { userId: true, businessName: true } })
    console.log("\nUsers in DB:")
    console.table(users)
}
main()

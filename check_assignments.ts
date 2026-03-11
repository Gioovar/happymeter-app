import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.userSettings.findMany({ select: { userId: true, businessName: true }})
  const members = await prisma.teamMember.findMany({ select: { id: true, name: true, ownerId: true }})
  const zones = await prisma.processZone.findMany({ select: { id: true, name: true, assignedStaffId: true, userId: true, branchId: true }})
  
  console.log("Team Members:"); console.table(members)
  console.log("\Zones:"); console.table(zones)
}
main()

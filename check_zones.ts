import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const members = await prisma.teamMember.findMany({ select: { id: true, name: true, ownerId: true }})
  const zones = await prisma.processZone.findMany({ 
    select: { id: true, name: true, assignedStaffId: true, userId: true, branchId: true, tasks: { select: { id: true, title: true, assignedStaffId: true } } }
  })
  
  console.log("Team Members:"); console.log(JSON.stringify(members, null, 2))
  console.log("\nZones:"); console.log(JSON.stringify(zones, null, 2))
}
main()

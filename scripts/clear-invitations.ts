import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    await prisma.teamInvitation.deleteMany({})
    console.log('Deleted all team invitations')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

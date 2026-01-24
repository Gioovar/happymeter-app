
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const profiles = await prisma.affiliateProfile.findMany()
    console.log('--- AFFILIATE PROFILES ---')
    console.log(profiles)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

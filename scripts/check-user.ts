
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'gtrendy2017@gmail.com'
    const user = await prisma.userSettings.findFirst({
        where: { email },
        include: { representativeProfile: true }
    })

    if (!user) {
        console.log(`User ${email} not found.`)
    } else {
        console.log(`User: ${user.email}`)
        console.log(`Role: ${user.role}`)
        console.log(`Representative Profile:`, user.representativeProfile)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

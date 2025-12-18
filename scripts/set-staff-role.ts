
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const userId = 'user_36ThFbtjrFp9M0fVQI8FEnyhhD5'

    // Check if user settings exists
    const settings = await prisma.userSettings.findUnique({ where: { userId } })

    if (settings) {
        await prisma.userSettings.update({
            where: { userId },
            data: { role: 'STAFF' }
        })
        console.log('✅ Updated existing user to STAFF')
    } else {
        await prisma.userSettings.create({
            data: {
                userId,
                role: 'STAFF'
            }
        })
        console.log('✅ Created new user settings as STAFF')
    }
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

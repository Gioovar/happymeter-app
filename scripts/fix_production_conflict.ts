
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'gtrendy2009@hotmail.com'
    console.log(`Checking for UserSettings with email: ${email}`)

    const users = await prisma.userSettings.findMany({
        where: {
            email: {
                contains: 'gtrendy', // Search broadly first
                mode: 'insensitive'
            }
        }
    })

    console.log('Found users:', users)

    const exactMatch = users.find(u => u.email.toLowerCase() === email.toLowerCase())

    if (exactMatch) {
        console.log(`Found exact match conflict: ${exactMatch.userId} - ${exactMatch.email}`)
        console.log('Deleting conflicting record...')
        await prisma.userSettings.delete({
            where: { userId: exactMatch.userId }
        })
        console.log('Deleted successfully.')
    } else {
        console.log('No exact match found to delete.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

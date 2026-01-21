
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRecentUsers() {
    console.log("Checking last 5 user settings...")
    try {
        const settings = await prisma.userSettings.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            }
        })
        console.log(JSON.stringify(settings, null, 2))
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

checkRecentUsers()

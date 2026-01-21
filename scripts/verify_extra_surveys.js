const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        const userSettings = await prisma.userSettings.findFirst()
        if (userSettings) {
            console.log('✅ UserSettings table accessible.')
            if ('extraSurveys' in userSettings) {
                console.log(`✅ 'extraSurveys' field found! Current value for one user: ${userSettings.extraSurveys}`)
            } else {
                console.error(`❌ 'extraSurveys' field NOT found in UserSettings object.`)
            }
        } else {
            console.log('⚠️ No users found in DB to check.')
        }
    } catch (e) {
        console.error('❌ Error checking DB:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()

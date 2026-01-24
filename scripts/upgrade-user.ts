import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Upgrading users...')
    try {
        // Update all users to PRO plan with 1000 surveys
        const result = await prisma.userSettings.updateMany({
            data: {
                plan: 'PRO',
                maxSurveys: 1000
            }
        })
        console.log(`Updated ${result.count} users to PRO plan with 1000 surveys.`)
    } catch (e) {
        console.error('Failed to upgrade users:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()

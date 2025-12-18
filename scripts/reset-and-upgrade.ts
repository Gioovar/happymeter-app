import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Limpiando base de datos y actualizando planes...')
    try {
        // 1. Delete all surveys (cascades to questions, responses, etc.)
        const deletedSurveys = await prisma.survey.deleteMany({})
        console.log(`✅ Se eliminaron ${deletedSurveys.count} encuestas antiguas.`)

        // 2. Update all existing UserSettings to PRO
        const updatedSettings = await prisma.userSettings.updateMany({
            data: {
                plan: 'PRO',
                maxSurveys: 1000
            }
        })
        console.log(`✅ Se actualizaron ${updatedSettings.count} usuarios al plan PRO (1000 encuestas).`)

    } catch (e) {
        console.error('❌ Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()

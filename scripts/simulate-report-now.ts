
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Creating Test Report Notification ---')

    const user = await prisma.userSettings.findFirst()
    if (!user) { console.log('No user found'); return }

    console.log(`Creating notification for user: ${user.userId}`)

    // Create a report that looks like it was generated just now.
    // The frontend will take this 'createdAt' and calculate [createdAt - 15 days] as the start date.
    await prisma.notification.create({
        data: {
            userId: user.userId,
            type: 'REPORT',
            title: '📊 Reporte de Prueba (Link)',
            message: 'Haz clic aquí para ver tus estadísticas filtradas por los últimos 15 días.',
            meta: {
                type: 'biweekly_report',
                note: 'Generated manually for testing date linking'
            }
        }
    })

    console.log('✅ Notification Created!')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

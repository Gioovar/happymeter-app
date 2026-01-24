
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Simulating Achievement Notification ---')

    const user = await prisma.userSettings.findFirst()
    if (!user) { console.log('No user found'); return }

    // Simulate "100 Responses" Milestone
    const count = 100
    const title = '¡Centenario de Feedback! 💯'
    const message = '¡Felicidades! Has alcanzado 100 respuestas. Tu compromiso con la calidad es evidente.'

    console.log(`Creating notification for user: ${user.userId}`)

    await prisma.notification.create({
        data: {
            userId: user.userId,
            type: 'ACHIEVEMENT',
            title: title,
            message: message,
            meta: { count: count, simulated: true }
        }
    })

    console.log('✅ Achievement Notification Created!')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())

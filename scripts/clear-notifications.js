
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function clearNotifications() {
    try {
        console.log('🗑️ Deleting all notifications...')
        const deleted = await prisma.notification.deleteMany({})
        console.log(`✅ Deleted ${deleted.count} notifications.`)
    } catch (e) {
        console.error('❌ Error deleting notifications:', e)
    } finally {
        await prisma.$disconnect()
    }
}

clearNotifications()

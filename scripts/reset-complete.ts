
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔴 INICIANDO RESET COMPLETO DE BASE DE DATOS...')
    console.log('⚠️ ESTO ELIMINARÁ TODOS LOS DATOS ⚠️')

    // Clean Child Tables first (Foreign Key Constraints)

    // 1. Survey Data
    console.log('Deleting Answers...')
    await prisma.answer.deleteMany()
    console.log('Deleting Responses...')
    await prisma.response.deleteMany()
    console.log('Deleting Questions...')
    await prisma.question.deleteMany()
    console.log('Deleting Surveys...')
    await prisma.survey.deleteMany()

    // 2. Chat Data (AI & Admin)
    console.log('Deleting Admin Chats...')
    await prisma.adminChatMessage.deleteMany()
    await prisma.adminChat.deleteMany()

    console.log('Deleting AI Chats...')
    await prisma.chatMessage.deleteMany()
    await prisma.chatThread.deleteMany()
    await prisma.aIInsight.deleteMany()

    // 3. Affiliate & Financial Data
    console.log('Deleting Visits & Referrals...')
    await prisma.placeVisit.deleteMany()
    await prisma.referral.deleteMany()
    await prisma.commission.deleteMany()
    await prisma.payout.deleteMany()

    // 4. Profiles
    console.log('Deleting Affiliate Profiles...')
    await prisma.affiliateProfile.deleteMany()

    // 5. System & Users
    console.log('Deleting Notifications & Logs...')
    await prisma.notification.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.sale.deleteMany()

    // 6. Root User Settings
    console.log('Deleting User Settings (Root)...')
    await prisma.userSettings.deleteMany()

    console.log('✅ BASE DE DATOS LIMPIA.')
    console.log('\n--- SIGUIENTES PASOS ---')
    console.log('1. Ve a tu Dashboard de Clerk -> Users')
    console.log('2. Selecciona TODOS los usuarios y elimínalos.')
    console.log('3. Regístrate de nuevo en la app para empezar desde cero.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting manual database cleanup...')

    try {
        // 1. Delete dependent data first
        console.log('Deleting Answers...')
        await prisma.answer.deleteMany()

        console.log('Deleting Responses...')
        await prisma.response.deleteMany()

        console.log('Deleting Questions...')
        await prisma.question.deleteMany()

        console.log('Deleting Surveys...')
        await prisma.survey.deleteMany()

        // 2. Clear Affiliate Data
        console.log('Deleting Commissions...')
        await prisma.commission.deleteMany()

        console.log('Deleting Payouts...')
        await prisma.payout.deleteMany()

        console.log('Deleting Referrals...')
        await prisma.referral.deleteMany()

        console.log('Deleting Affiliate Profiles...')
        await prisma.affiliateProfile.deleteMany()

        // 3. Clear User Data
        console.log('Deleting Sales...')
        await prisma.sale.deleteMany()

        console.log('Deleting User Settings...')
        await prisma.userSettings.deleteMany()

        console.log('Deleting Audit Logs...')
        await prisma.auditLog.deleteMany()

        console.log('✅ Database successfully cleared!')
    } catch (error) {
        console.error('❌ Error clearing database:', error)
        process.exit(1)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🧹 Starting Production Cleanup...')

    try {
        // 1. Clean Financial Data (Sales, Commissions, Referrals)
        console.log('...Deleting mock financial records')
        await prisma.sale.deleteMany({ where: { status: { not: 'REAL_TRANSACTION_FLAG' } } }) // Delete all for now unless we have a flag
        await prisma.commission.deleteMany()
        await prisma.referral.deleteMany()
        await prisma.coupon.deleteMany({ where: { code: { in: ['WELCOME20', 'LAUNCH50'] } } })

        // 2. Clean Survey Responses (Keep the Surveys themselves if they are real, but delete mock responses)
        console.log('...Deleting mock responses')
        // Option: Delete responses from specific dates or all responses? 
        // For launch, we probably want 0 responses.
        await prisma.answer.deleteMany()
        await prisma.response.deleteMany()

        // 3. Clean Mock Users (if any specific ones exist)
        // Only if we can identify them. The seed used 'user_mock_1', etc.
        // Real users (Clerk IDs) usually have different format or we can filter by email.
        // For safety, we won't delete Users table blindly.

        console.log('...Deleting mock Brand Assets')
        await prisma.brandAsset.deleteMany({ where: { name: { in: ['Logo Principal', 'Banner Promo'] } } })

        console.log('✅ Cleanup Finished. Ready for Production.')
    } catch (e) {
        console.error('❌ Error during cleanup:', e)
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

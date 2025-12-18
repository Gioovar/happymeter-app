import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🧪 Testing Growth API Logic...')

    // 1. Setup: Create 2 temp sales
    const user = await prisma.userSettings.findFirst() // Need a user ID
    if (!user) {
        console.log('⚠️ No users found. Skipping test (Code needs at least one user to link sale).')
        return
    }

    console.log('...Inserting temp sales')
    const sale1 = await prisma.sale.create({
        data: {
            userId: user.userId,
            plan: 'TEST_PLAN',
            amount: 100,
            currency: 'usd',
            status: 'COMPLETED',
            createdAt: new Date()
        }
    })

    // Sale from last month
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const sale2 = await prisma.sale.create({
        data: {
            userId: user.userId,
            plan: 'TEST_PLAN',
            amount: 50,
            currency: 'usd',
            status: 'COMPLETED',
            createdAt: lastMonth
        }
    })

    try {
        // 2. Logic to Test (Mirrors API New Logic)
        const totalSales = await prisma.sale.aggregate({
            _sum: { amount: true },
            where: { status: 'COMPLETED' }
        })

        // Count surveys too
        const totalSurveys = await prisma.survey.count()

        console.log('💰 Total Revenue:', totalSales._sum.amount)
        console.log('📊 Total Surveys:', totalSurveys)

        if (totalSales._sum.amount === 150) {
            console.log('✅ Revenue Aggregation Correct')
        } else {
            console.error('❌ Revenue Aggregation Failed')
        }

    } finally {
        // 3. Cleanup
        console.log('...Cleaning up temp sales')
        await prisma.sale.delete({ where: { id: sale1.id } })
        await prisma.sale.delete({ where: { id: sale2.id } })
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

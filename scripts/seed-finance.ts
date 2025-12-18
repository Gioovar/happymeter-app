
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Finance Data...')

    // 1. Ensure we have at least one active creator
    let creator = await prisma.affiliateProfile.findFirst({
        where: { status: 'ACTIVE' }
    })

    // If no creator, find a user to make creator
    if (!creator) {
        const user = await prisma.userSettings.findFirst()
        if (!user) {
            console.error('No users found. Run base seed first.')
            return
        }
        creator = await prisma.affiliateProfile.create({
            data: {
                userId: user.userId,
                status: 'ACTIVE',
                bio: 'Seeded Creator',
                commissionRate: 10, // 10%
                promoCode: 'SEED10',
                instagram: 'seeded_inst'
            }
        })
    }

    // 2. Create some referrals for this creator (Users who "bought" stuff)
    // We'll create "Fake Users" if needed by just using random IDs if FK allows, 
    // but Prisma requires UserSettings usually. Let's assume we can map to existing users or just Reuse the main user for simplicity of data, 
    // OR creates fake sales not strictly strictly bound if checks are loose. 
    // Actually, Sale links to userId. Referral links to userId.
    // Let's iterate and create dummy referrals + Sales using the SAME userId (self-referral for mock purposes) or valid ones.
    // To be safe, let's just create sales for the *current* creator's user ID and say they were referred by themselves (circular but works for stats)
    // Or better, let's try to find other users.

    const otherUsers = await prisma.userSettings.findMany({ take: 5 })

    for (const u of otherUsers) {
        // Upsert referral
        await prisma.referral.upsert({
            where: { referredUserId: u.userId },
            update: { affiliateId: creator.id, status: 'CONVERTED', convertedAt: new Date() },
            create: {
                affiliateId: creator.id,
                referredUserId: u.userId,
                status: 'CONVERTED',
                convertedAt: new Date()
            }
        })

        // Create Sale
        await prisma.sale.create({
            data: {
                userId: u.userId,
                plan: 'PREMIUM_YR',
                amount: 199.00, // $199 sale
                currency: 'USD',
                status: 'COMPLETED'
            }
        })
    }

    // 3. Create some Payouts
    await prisma.payout.create({
        data: {
            affiliateId: creator.id,
            amount: 50.00,
            status: 'PAID'
        }
    })

    await prisma.payout.create({
        data: {
            affiliateId: creator.id,
            amount: 25.50,
            status: 'PAID'
        }
    })

    console.log('✅ Finance Data Seeded: Created sales and payouts.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

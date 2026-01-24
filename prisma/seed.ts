
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // --- 1. CLEANUP ---
    await prisma.sale.deleteMany()
    await prisma.commission.deleteMany()
    await prisma.referral.deleteMany()
    await prisma.affiliateProfile.deleteMany()
    await prisma.coupon.deleteMany()
    await prisma.answer.deleteMany()
    await prisma.question.deleteMany()
    await prisma.response.deleteMany()
    await prisma.survey.deleteMany()
    await prisma.brandAsset.deleteMany()

    // --- 2. ADMIN DATA ---
    console.log('Creating Admin Data...')

    // Brand Assets
    await prisma.brandAsset.createMany({
        data: [
            { name: 'Logo Principal', url: 'https://placehold.co/400x100/111/FFF?text=HappyMeter+Logo', type: 'LOGO' },
            { name: 'Banner Promo', url: 'https://placehold.co/1200x400/8b5cf6/FFF?text=Promo+Banner', type: 'BANNER' },
            { name: 'Social Media Kit', url: 'https://placehold.co/800x800/222/FFF?text=Social+Kit', type: 'OTHER' },
        ]
    })

    // Coupons
    await prisma.coupon.createMany({
        data: [
            { code: 'WELCOME20', type: 'PERCENTAGE', value: 20, maxUses: 100 },
            { code: 'LAUNCH50', type: 'FIXED', value: 50, maxUses: 10 },
            { code: 'FREETRIAL30', type: 'TRIAL', value: 30 }, // 30 days
        ]
    })

    // Global Sales (Admin Stats)
    const users = ['user_mock_1', 'user_mock_2', 'user_mock_3']
    let totalSales = 0
    for (let i = 0; i < 20; i++) {
        const amount = Math.random() > 0.5 ? 29.99 : 99.99
        await prisma.sale.create({
            data: {
                userId: users[Math.floor(Math.random() * users.length)],
                plan: amount > 50 ? 'PRO' : 'STARTER',
                amount: amount,
                status: 'COMPLETED',
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date last 30 days
            }
        })
        totalSales += amount
    }

    // --- 3. CREATOR DATA ---
    console.log('Creating Creator Data...')

    const creatorId = 'user_2ozM8j...mock' // Simulating a logged-in creator
    const affiliate = await prisma.affiliateProfile.create({
        data: {
            userId: creatorId,
            code: 'demo_creator',
            balance: 1500.50,
            paypalEmail: 'creator@demo.com'
        }
    })

    // Referrals
    for (let i = 0; i < 15; i++) {
        const isConverted = Math.random() > 0.6
        await prisma.referral.create({
            data: {
                affiliateId: affiliate.id,
                referredUserId: `referred_user_${i}`,
                status: isConverted ? 'CONVERTED' : 'LEAD',
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                convertedAt: isConverted ? new Date() : null
            }
        })

        if (isConverted) {
            await prisma.commission.create({
                data: {
                    affiliateId: affiliate.id,
                    amount: 25.00,
                    description: 'Commission for Starter Plan',
                    status: Math.random() > 0.5 ? 'PAID' : 'PENDING'
                }
            })
        }
    }

    // --- 4. USER DATA (SURVEYS) ---
    console.log('Creating User Data...')

    const ownerId = 'user_mock_owner'
    const survey = await prisma.survey.create({
        data: {
            userId: ownerId,
            title: 'Encuesta de Satisfacción 2024',
            description: 'Ayúdanos a mejorar nuestros servicios',
            questions: {
                create: [
                    { text: '¿Qué te pareció el servicio?', type: 'RATING', order: 1 },
                    { text: '¿Recomendarías nuestro producto?', type: 'EMOJI', order: 2 },
                    { text: 'Déjanos un comentario adicional', type: 'TEXT', order: 3, required: false }
                ]
            }
        }
    })

    // Responses
    for (let i = 0; i < 10; i++) {
        await prisma.response.create({
            data: {
                surveyId: survey.id,
                customerName: `Cliente ${i}`,
                answers: {
                    create: [
                        { questionId: (await prisma.question.findFirst({ where: { surveyId: survey.id, type: 'RATING' } }))!.id, value: Math.floor(Math.random() * 5 + 1).toString() },
                        { questionId: (await prisma.question.findFirst({ where: { surveyId: survey.id, type: 'EMOJI' } }))!.id, value: ['😡', '😐', '😃', '😍'][Math.floor(Math.random() * 4)] }
                    ]
                }
            }
        })
    }

    console.log('✅ Seed finished successfully')
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

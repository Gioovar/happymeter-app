
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const targetUserId = 'user_36GKvPBupsEHF8i5HpMkX3d6cvI'
    const targetAffiliateId = '1bd92c61-7234-41cd-b6d5-e93e5fecc423'

    console.log(`🌱 Populating data for user: ${targetUserId}`)

    // --- 1. AFFILIATE DATA (Creator Dashboard) ---

    // Create Referrals
    console.log('Creating referrals...')
    const names = ['Ana García', 'Carlos López', 'Maria Rodriguez', 'Juan Perez', 'Sofia Martinez', 'Luis Hernandez', 'Elena Torres']

    for (let i = 0; i < 25; i++) {
        const isConverted = Math.random() > 0.4
        const name = names[Math.floor(Math.random() * names.length)]
        const email = `${name.toLowerCase().replace(' ', '.')}@gmail.com`

        await prisma.referral.create({
            data: {
                affiliateId: targetAffiliateId,
                referredUserId: `mock_ref_${i}_${Date.now()}`,
                leadName: name,
                leadEmail: email,
                socialLink: `https://instagram.com/${name.toLowerCase().replace(' ', '')}_${i}`,
                status: isConverted ? 'CONVERTED' : 'LEAD',
                createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Last 60 days
                convertedAt: isConverted ? new Date() : null
            }
        })

        if (isConverted) {
            await prisma.commission.create({
                data: {
                    affiliateId: targetAffiliateId,
                    amount: Math.random() > 0.5 ? 29.99 * 0.4 : 99.99 * 0.4, // 40% commission
                    description: Math.random() > 0.5 ? 'Comisión Plan Starter' : 'Comisión Plan Pro',
                    status: Math.random() > 0.3 ? 'PAID' : 'PENDING',
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
                }
            })
        }
    }

    // Update Balance
    const commissions = await prisma.commission.aggregate({
        where: { affiliateId: targetAffiliateId, status: 'PAID' },
        _sum: { amount: true }
    })

    await prisma.affiliateProfile.update({
        where: { id: targetAffiliateId },
        data: { balance: commissions._sum.amount || 0 }
    })


    // --- 2. USER DATA (User Dashboard) ---
    console.log('Creating surveys...')

    // Create a UserSettings if not exists
    await prisma.userSettings.upsert({
        where: { userId: targetUserId },
        update: { plan: 'PRO', maxSurveys: 100 },
        create: { userId: targetUserId, plan: 'PRO', maxSurveys: 100 }
    })

    // Create Surveys
    const surveyTitles = ['Encuesta de Satisfacción', 'Feedback de Producto', 'NPS Marzo 2025']

    for (const title of surveyTitles) {
        const survey = await prisma.survey.create({
            data: {
                userId: targetUserId,
                title: title,
                description: 'Gracias por ayudarnos a mejorar.',
                questions: {
                    create: [
                        { text: '¿Cómo calificarías tu experiencia?', type: 'EMOJI', order: 1 },
                        { text: '¿Qué podríamos mejorar?', type: 'TEXT', order: 2, required: false }
                    ]
                }
            }
        })

        // Create Responses for each survey
        for (let i = 0; i < 15; i++) {
            await prisma.response.create({
                data: {
                    surveyId: survey.id,
                    customerName: `Cliente ${i}`,
                    answers: {
                        create: [
                            { questionId: (await prisma.question.findFirst({ where: { surveyId: survey.id, type: 'EMOJI' } }))!.id, value: Math.floor(Math.random() * 5 + 1).toString() },
                            { questionId: (await prisma.question.findFirst({ where: { surveyId: survey.id, type: 'TEXT' } }))!.id, value: 'Muy buen servicio!' }
                        ]
                    }
                }
            })
        }
    }

    console.log('✅ Data populated successfully for gtrendy2017!')
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

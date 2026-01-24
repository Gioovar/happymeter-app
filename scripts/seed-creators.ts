
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Mock Creators...')

    // 1. Create Mock Users first (if they don't exist, we need real userIds, so we'll look for existing ones or create dummies)
    // Ideally, we attach to existing users or create new ones. For safety, let's create new ones with unique emails mock.

    const mockCreators = [
        {
            name: "Sofia Lifestyle",
            email: "sofia.mock@example.com",
            code: "SOFIA_STYLE",
            niche: "Moda y Estilo",
            instagram: "@sofia_style",
            phone: "+525511223344",
            balance: 150.00
        },
        {
            name: "Diego Foodie",
            email: "diego.foodie@example.com",
            code: "DIEGO_EATS",
            niche: "Gastronomía",
            instagram: "@diego_bites",
            phone: "+525599887766",
            balance: 45.50
        },
        {
            name: "Carla Fitness",
            email: "carla.fit@example.com",
            code: "CARLA_FIT",
            niche: "Salud y Fitness",
            instagram: "@carla_gym",
            phone: "+525544556677",
            balance: 320.00
        }
    ]

    for (const creator of mockCreators) {
        // Upsert User
        // Note: In real app, Clerk handles auth ID. Here we mock it.
        const mockUserId = `mock_user_${creator.code}`

        const userSettings = await prisma.userSettings.upsert({
            where: { userId: mockUserId },
            update: {},
            create: {
                userId: mockUserId,
                businessName: creator.name,
                phone: creator.phone,
                socialLinks: { instagram: creator.instagram },
                isOnboarded: true,
                role: 'USER'
            }
        })

        // Upsert Affiliate Profile
        const profile = await prisma.affiliateProfile.upsert({
            where: { userId: mockUserId },
            update: {
                balance: creator.balance, // Reset balance for testing
                status: 'ACTIVE'
            },
            create: {
                userId: mockUserId,
                code: creator.code,
                paypalEmail: creator.email,
                balance: creator.balance,
                status: 'ACTIVE',
                niche: creator.niche,
                instagram: creator.instagram,
                whatsapp: creator.phone,
                notes: "Creador mockup generado automáticamente."
            }
        })

        console.log(`✅ Upserted Creator: ${creator.name}`)

        // Create Mock Visits
        await prisma.placeVisit.create({
            data: {
                place: {
                    create: {
                        name: "Restaurante Demo " + Math.floor(Math.random() * 100),
                        description: "Lugar de prueba",
                        address: "Av. Reforma 123"
                    }
                },
                creator: { // Fix: Usage of connect
                    connect: { id: profile.id }
                },
                visitDate: new Date(),
                status: 'APPROVED'
            }
        })

        // Create Mock Commissions
        await prisma.commission.createMany({
            data: [
                {
                    affiliateId: profile.id,
                    amount: 10.50,
                    description: "Comisión por Venta #123",
                    status: 'PENDING',
                    createdAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
                },
                {
                    affiliateId: profile.id,
                    amount: 25.00,
                    description: "Bono de Bienvenida",
                    status: 'PAID',
                    createdAt: new Date(Date.now() - 86400000 * 5) // 5 days ago
                }
            ]
        })

        // Create Mock Payouts
        if (creator.balance > 100) {
            await prisma.payout.create({
                data: {
                    affiliateId: profile.id,
                    amount: 50.00,
                    status: 'COMPLETED',
                    createdAt: new Date(Date.now() - 86400000 * 10) // 10 days ago
                }
            })
        }
    }

    console.log('✨ Seed Complete! Refresh the Staff Dashboard.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

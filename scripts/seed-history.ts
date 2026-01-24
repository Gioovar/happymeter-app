
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('📜 Seeding 2 Months of Operational History...')

    // --- Helpers ---
    const getRandomDateInPast = (daysAgo: number) => {
        const date = new Date()
        const daysToSubtract = Math.floor(Math.random() * daysAgo)
        date.setDate(date.getDate() - daysToSubtract)
        return date
    }

    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

    // 1. Ensure Creators (Mixed Status)
    console.log('... Processing Creators')
    const creators = [
        { name: 'Ana García', code: 'ANA2024', status: 'PENDING' },
        { name: 'Carlos Ruíz', code: 'CARLOSVLOGS', status: 'PENDING' },
        { name: 'Sofia M', code: 'SOFIAM', status: 'PENDING' }, // Requested 3 pending
        { name: 'Luis Active', code: 'LUISLIVE', status: 'ACTIVE', rate: 15 },
        { name: 'Marta Gold', code: 'MARTAG', status: 'ACTIVE', rate: 25 },
        { name: 'Pedro Basic', code: 'PEDROB', status: 'ACTIVE', rate: 10 }
    ]

    let activeCreatorIds: string[] = []

    for (const c of creators) {
        const userId = `user-hist-${c.code.toLowerCase()}`

        // Ensure Parent User Exists (Fixes Foreign Key Error)
        await prisma.userSettings.upsert({
            where: { userId },
            update: {},
            create: {
                userId,
                plan: 'FREE',
                role: 'USER'
            }
        })

        // Then create Affiliate Profile
        let profile = await prisma.affiliateProfile.upsert({
            where: { userId },
            update: {
                status: c.status,
                avgRating: c.status === 'ACTIVE' ? getRandomInt(30, 50) / 10 : 0
            },
            create: {
                userId,
                status: c.status,
                // bio field removed as it doesn't exist. Using notes/contentStrategy if needed or omission.
                contentStrategy: `${c.name} - Strategy`,
                commissionRate: c.rate || 10,
                instagram: `@${c.code.toLowerCase()}`,
                code: c.code
            }
        })

        if (c.status === 'ACTIVE') activeCreatorIds.push(profile.id)
    }

    // 2. Generate Historical Sales (Last 60 Days) for Active Creators
    console.log('... Generating 60 Days of Sales History')
    if (activeCreatorIds.length > 0) {
        for (let i = 0; i < 50; i++) { // 50 Sales distributed
            const creatorId = activeCreatorIds[getRandomInt(0, activeCreatorIds.length - 1)]
            const creator = await prisma.affiliateProfile.findUnique({ where: { id: creatorId } })

            if (!creator) continue

            const date = getRandomDateInPast(60) // Up to 60 days ago
            const amount = getRandomInt(500, 2500) / 100 // $5.00 to $25.00 randomish amounts for volume or subscription prices like 199, 299

            // Sale (Linked to User, usually the buyer)
            // We need a buyer User ID. Just use a mock.
            const buyerId = `buyer-${getRandomInt(1000, 9999)}`

            // Create Referral (Conversion)
            await prisma.referral.create({
                data: {
                    affiliateId: creator.id,
                    referredUserId: buyerId,
                    status: 'CONVERTED',
                    convertedAt: date,
                    createdAt: date
                }
            })

            // Create Sale
            await prisma.sale.create({
                data: {
                    userId: buyerId,
                    plan: 'PREMIUM_M',
                    amount: amount * 10, // Make them larger: $50 - $250
                    currency: 'USD',
                    status: 'COMPLETED',
                    createdAt: date
                }
            })

            // Create Commission (Liability)
            await prisma.commission.create({
                data: {
                    affiliateId: creator.id,
                    amount: (amount * 10) * (creator.commissionRate / 100),
                    description: `Commission ${date.toLocaleDateString()}`,
                    status: 'PENDING',
                    createdAt: date
                }
            })
        }
    }

    // 3. Generate Inbox / Chats
    console.log('... Populating Inbox with Chats')
    if (activeCreatorIds.length > 0) {
        // Create 3 threads
        const subjects = ['Duda sobre mi pago', 'Problema con un enlace', 'Solicitud de colaboración']

        for (const subj of subjects) {
            const creatorId = activeCreatorIds[getRandomInt(0, activeCreatorIds.length - 1)]

            const chat = await prisma.adminChat.create({
                data: {
                    creatorId: creatorId,
                    status: 'OPEN',
                    createdAt: getRandomDateInPast(5)
                }
            })

            // Add messages
            await prisma.adminChatMessage.create({
                data: {
                    chatId: chat.id,
                    senderId: 'creator_user_id', // Mock
                    content: `${subj} - Hola equipo, necesito ayuda con esto.`,
                    isRead: false,
                    createdAt: chat.createdAt
                }
            })
        }
    }

    // 4. Generate Audit Logs (Rolling History)
    console.log('... Generating Audit Logs History')
    const logActions = ['USER_LOGIN', 'SETTINGS_CHANGE', 'PAYOUT_REQUEST', 'VISIT_COMPLETED', 'PROFILE_UPDATE']

    for (let i = 0; i < 15; i++) {
        await prisma.auditLog.create({
            data: {
                action: logActions[getRandomInt(0, logActions.length - 1)],
                entityId: `ent-${i}`,
                entityType: 'USER',
                performedBy: `user-${getRandomInt(1, 10)}`,
                details: { info: 'Automated history log' },
                createdAt: getRandomDateInPast(30),
                adminId: 'system-admin'
            }
        })
    }

    console.log('✅ History Seeded: 60 days of sales, pending creators, chats, and logs.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

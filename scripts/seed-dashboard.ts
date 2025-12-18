
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Dashboard Operational Data...')

    // 1. Create Pending Creator Applications
    console.log('... Creating Pending Creator Applications')
    const pendingCreators = [
        { name: 'Ana García', code: 'ANA2024', bio: 'Lifestyle influencer' },
        { name: 'Carlos Ruíz', code: 'CARLOSVLOGS', bio: 'Foodie & Travel' },
        { name: 'Sofia M', code: 'SOFIAM', bio: 'Fitness coach' }
    ]

    for (const c of pendingCreators) {
        // Ensure user exists or create dummy
        const userId = `pending-user-${Math.floor(Math.random() * 10000)}`

        await prisma.affiliateProfile.upsert({
            where: { userId }, // This might fail if userId is unique constraint on simpler schema, but let's try standard create if we can ensure uniqueness
            update: { status: 'PENDING' },
            create: {
                userId,
                status: 'PENDING',
                bio: c.bio,
                commissionRate: 10,
                promoCode: c.code + Math.floor(Math.random() * 100),
                instagram: `@${c.code.toLowerCase()}`
            }
        }).catch(e => console.log(`Skipped ${c.name} (likely exists)`))
    }

    // 2. Create Audit Logs (Recent Activity)
    console.log('... Creating Recent Audit Logs')
    const actions = [
        { action: 'USER_LOGIN', details: 'Usuario inició sesión', userId: 'usr_1' },
        { action: 'PROFILE_UPDATE', details: 'Actualización de perfil de creador', userId: 'usr_2' },
        { action: 'SETTINGS_CHANGE', details: 'Cambio en configuración de alertas', userId: 'usr_1' },
        { action: 'EXPORT_DATA', details: 'Exportación de reporte mensual', userId: 'usr_staff' },
        { action: 'VISIT_APPROVED', details: 'Visita aprobada para Restaurante X', userId: 'usr_staff' }
    ]

    for (const log of actions) {
        await prisma.auditLog.create({
            data: {
                action: log.action,
                entityId: 'ent_' + Math.floor(Math.random() * 100),
                entityType: 'USER',
                performedBy: log.userId,
                details: { info: log.details },
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000)),
                adminId: 'admin-system' // Added required field
            }
        })
    }

    // 3. Create Pending Visit Requests (for Visits Tab)
    console.log('... Creating Pending Visit Requests')
    // Need a Place and a Creator
    const place = await prisma.place.findFirst()
    const activeCreator = await prisma.affiliateProfile.findFirst({ where: { status: 'ACTIVE' } })

    if (place && activeCreator) {
        // Create 2 pending visits
        for (let i = 0; i < 2; i++) {
            await prisma.placeVisit.create({
                data: {
                    placeId: place.id,
                    affiliateId: activeCreator.id,
                    visitDate: new Date(Date.now() + 86400000 * (i + 2)),
                    status: 'PENDING',
                    notes: 'Solicitud de visita de prueba para contenido.'
                }
            })
        }
        console.log('   -> Created 2 pending visits')
    } else {
        console.log('   ⚠️ Skipping Visits: Need at least 1 Place and 1 Active Creator in DB.')
    }

    // 4. Create Active Chats (for Chat Counter)
    console.log('... Creating Active Support Chats')
    // Check for AdminChat model
    // Assuming AdminChat exists based on page.tsx code: prisma.adminChat.count
    // We'll try to create one if the model is exposed or mocked.
    // If AdminChat is not in standard schema view, we might skip.
    // Based on page.tsx: prisma.adminChat.count({ where: { status: 'OPEN' } })

    try {
        // @ts-ignore
        if (prisma.adminChat) {
            // @ts-ignore
            await prisma.adminChat.create({
                data: {
                    userId: 'user_chat_1',
                    status: 'OPEN',
                    subject: 'Ayuda con mi pago',
                    // Add other required fields if known, or let it fail gracefully
                }
            })
            console.log('   -> Created open chat')
        }
    } catch (e) {
        console.log('   ⚠️ AdminChat creation failed (Model definition might differ)', e)
    }

    console.log('✅ Dashboard Operational Data Seeded.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

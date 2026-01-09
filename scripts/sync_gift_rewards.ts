
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting sync of First Visit Gift rewards...')

    // 1. Get all programs with the feature enabled
    const programs = await prisma.loyaltyProgram.findMany({
        where: {
            enableFirstVisitGift: true
        },
        include: {
            rewards: true
        }
    })

    console.log(`Found ${programs.length} programs with gift enabled.`)

    let updatedCount = 0

    for (const program of programs) {
        // Check if system gift exists
        const hasSystemGift = program.rewards.some(r => r.description === 'SYSTEM_GIFT')

        if (!hasSystemGift) {
            console.log(`Creating gift reward for program: ${program.businessName} (${program.id})`)

            const giftText = program.firstVisitGiftText || "Regalo de Bienvenida"

            await prisma.loyaltyReward.create({
                data: {
                    programId: program.id,
                    name: giftText,
                    description: "SYSTEM_GIFT",
                    costInVisits: 1,
                    isActive: true
                }
            })
            updatedCount++
        }
    }

    console.log(`Sync complete! Created ${updatedCount} missing rewards.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

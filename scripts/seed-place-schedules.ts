import { prisma } from '../src/lib/prisma'

async function main() {
    console.log('Seeding schedules for existing places...')

    try {
        const places = await prisma.place.findMany()

        for (const place of places) {
            // Only update if no schedule exists
            if (!place.scheduleConfig) {
                await prisma.place.update({
                    where: { id: place.id },
                    data: {
                        scheduleConfig: {
                            // Example schedule: Tues-Sun, 1pm-10pm
                            allowedDays: [2, 3, 4, 5, 6, 0],
                            timeRange: { start: '13:00', end: '22:00' }
                        }
                    }
                })
                console.log(`Updated schedule for: ${place.name}`)
            }
        }

        console.log('Done!')
    } catch (error) {
        console.error('Error seeding:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()

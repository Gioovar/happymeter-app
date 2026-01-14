import { prisma } from "../src/lib/prisma"

async function main() {
    console.log("Starting forced cleanup of past reservations...")

    // Define "past" as anything older than 6 hours from now to be safe, 
    // or just older than now if strictly interpreted.
    // Given the user's screenshot shows days ago (Jan 9 vs Jan 14), a 12 hour buffer is very safe.
    // Let's use 4 hours to be more aggressive as per user request.
    const cutoffDate = new Date(Date.now() - 4 * 60 * 60 * 1000)

    console.log(`Marking all CONFIRMED reservations before ${cutoffDate.toLocaleString()} as NO_SHOW`)

    const result = await prisma.reservation.updateMany({
        where: {
            status: 'CONFIRMED',
            date: {
                lt: cutoffDate
            }
        },
        data: {
            status: 'NO_SHOW'
        }
    })

    console.log(`✅ Update complete. Modified ${result.count} reservations.`)
}

main()
    .catch(e => {
        console.error("❌ Error:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

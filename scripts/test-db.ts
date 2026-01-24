
import { prisma } from "../src/lib/prisma"

async function main() {
    console.log("Starting DB Test...")

    // 1. Get a user
    const user = await prisma.userSettings.findFirst()
    if (!user) {
        console.error("No user found")
        return
    }
    const userId = user.userId
    console.log("Testing with userId:", userId)

    // 2. Mock Logic from getDashboardReservations
    const floorPlans = await prisma.floorPlan.findMany({
        where: { userId },
        select: { id: true }
    })
    console.log("FloorPlans found:", floorPlans.length)

    const floorPlanIds = floorPlans.map(fp => fp.id)

    const monthDate = new Date()
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1)
    const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 2, 0)

    console.log("Querying reservations...")
    console.log("floorPlanIds:", floorPlanIds)

    try {
        const reservations = await prisma.reservation.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end
                },
                table: {
                    floorPlanId: { in: floorPlanIds }
                }
            },
            include: {
                table: true
            },
            orderBy: { date: 'asc' }
        })

        console.log("Reservations found:", reservations.length)
        console.log("First reservation:", reservations[0])

        // Test Mapping
        const formatted = reservations.map((r: any) => {
            let timeStr = "00:00"
            try {
                const d = new Date(r.date)
                const hours = d.getHours().toString().padStart(2, '0')
                const minutes = d.getMinutes().toString().padStart(2, '0')
                timeStr = `${hours}:${minutes}`
            } catch (e) {
                console.error("Date parsing error", e)
            }

            return {
                id: r.id,
                date: r.date,
                time: timeStr,
                customerName: r.customerName || "Cliente",
                tableName: r.table?.label || "Mesa",
                pax: r.partySize || 4,
                status: r.status
            }
        })

        console.log("Formatted count:", formatted.length)

    } catch (error) {
        console.error("QUERY FAILED:", error)
    }
}

main()

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. Define Current Time boundaries
        const now = new Date()

        // We look for reservations that should be active right now
        // A reservation is "active" if its start `date` is in the past,
        // and its (date + duration) is either just ending or already ended (overstay).

        // Let's get all reservations for today that have already started
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)

        const activeAndFinishedReservations = await prisma.reservation.findMany({
            where: {
                userId,
                date: {
                    gte: todayStart,
                    lte: now // Only started reservations
                },
                status: 'CONFIRMED'
            },
            include: {
                table: true
            }
        })

        const activeTables = []
        const problematicTables = []
        let totalActivePax = 0

        // 2. Evaluate Each Table's Service Time
        // The standard duration is typically 120 mins.
        // We will calculate exact elapsed time vs expected duration.

        for (const res of activeAndFinishedReservations) {
            const startTime = new Date(res.date).getTime()
            const currentTime = now.getTime()

            // Elapsed time in minutes
            const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60))
            const expectedDuration = res.duration || 120

            // Calculate percentage of target time consumed
            const timeConsumedPercentage = (elapsedMinutes / expectedDuration) * 100

            // If a table left early, it might be marked COMPLETE by a POS in the future.
            // For now, if it's over 150% of expected duration, we assume they left or system wasn't updated.
            // But if it's between 80% and 150%, it's an active table.

            // For the sake of this radar, we track tables currently seated
            if (elapsedMinutes > (expectedDuration + 90)) {
                // Ignore tables that started 3+ hours ago (likely gone and forgotten to clear status)
                continue;
            }

            let status = 'NORMAL' // Green
            if (elapsedMinutes >= expectedDuration) {
                status = 'CRITICAL' // Red (Overstaying, delaying next turn)
            } else if (timeConsumedPercentage >= 80) {
                status = 'WARNING' // Yellow (Approaching end of time)
            }

            const tableProfile = {
                reservationId: res.id,
                tableName: res.table?.label || `Mesa ${res.customerName.split(' ')[0]}`,
                customerName: res.customerName,
                partySize: res.partySize,
                elapsedMinutes,
                expectedDuration,
                status,
                exceededByMinutes: status === 'CRITICAL' ? (elapsedMinutes - expectedDuration) : 0,
                startedAt: res.date
            }

            activeTables.push(tableProfile)
            totalActivePax += res.partySize

            if (status === 'CRITICAL' || status === 'WARNING') {
                problematicTables.push(tableProfile)
            }
        }

        // Sort by longest overstay
        problematicTables.sort((a, b) => b.elapsedMinutes - a.elapsedMinutes)
        activeTables.sort((a, b) => b.elapsedMinutes - a.elapsedMinutes)

        return NextResponse.json({
            activeTablesCount: activeTables.length,
            totalActivePax,
            problematicTablesCount: problematicTables.length,
            tables: activeTables,
            alerts: problematicTables
        })

    } catch (error) {
        console.error('[ACTIVE_TABLES_API]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

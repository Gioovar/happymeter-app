import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        // Define the threshold for "expired" reservations.
        // For example, 6 hours after the reservation time.
        // If a reservation is at 8:00 PM, and it's now 3:00 AM the next day, it should be NO_SHOW if still CONFIRMED.

        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)

        // Find reservations that are CONFIRMED and older than the threshold
        const result = await prisma.reservation.updateMany({
            where: {
                status: 'CONFIRMED',
                date: {
                    lt: sixHoursAgo
                }
            },
            data: {
                status: 'NO_SHOW'
            }
        })

        return NextResponse.json({
            success: true,
            message: `Updated ${result.count} reservations to NO_SHOW`,
            count: result.count
        })

    } catch (error) {
        console.error("Error in cleanup cron:", error)
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
    }
}

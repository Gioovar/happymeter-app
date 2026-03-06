import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. Time Boundaries
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const endOfDay = new Date(today)
        endOfDay.setHours(23, 59, 59, 999)

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // 2. Fetch Today's Reservations
        const todaysReservations = await prisma.reservation.findMany({
            where: {
                userId,
                date: { gte: today, lte: endOfDay },
                status: 'CONFIRMED'
            }
        })

        // 3. Fetch Historical Data (Last 30 Days) for Baseline
        // We use surveys and loyalty visits as a proxy for walk-in traffic
        const recentResponses = await prisma.response.findMany({
            where: {
                survey: { userId },
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { createdAt: true }
        })

        const loyaltyVisits = await prisma.loyaltyVisit.findMany({
            where: {
                program: { userId },
                visitDate: { gte: thirtyDaysAgo }
            },
            select: { visitDate: true }
        })

        // 4. Calculate Historical Baseline Traffic per Hour (12:00 to 23:00)
        const currentDayOfWeek = new Date().getDay()
        const historicalHourlyTraffic: Record<number, number> = {}

        // Initialize hours
        for (let i = 12; i <= 23; i++) {
            historicalHourlyTraffic[i] = 0
        }

        // Aggregate Surveys (Higher weight for walk-ins on the same day of the week)
        recentResponses.forEach(r => {
            const rDate = new Date(r.createdAt)
            if (rDate.getDay() === currentDayOfWeek) {
                const hour = rDate.getHours()
                if (hour >= 12 && hour <= 23) {
                    historicalHourlyTraffic[hour] += 2 // Surveys represent a group usually
                }
            }
        })

        // Aggregate Loyalty Visits
        loyaltyVisits.forEach(v => {
            const vDate = new Date(v.visitDate)
            if (vDate.getDay() === currentDayOfWeek) {
                const hour = vDate.getHours()
                if (hour >= 12 && hour <= 23) {
                    historicalHourlyTraffic[hour] += 1
                }
            }
        })

        // 5. Calculate Real-Time Booking Load per Hour
        const reservationHourlyLoad: Record<number, number> = {}
        for (let i = 12; i <= 23; i++) {
            reservationHourlyLoad[i] = 0
        }

        todaysReservations.forEach(res => {
            const resDate = new Date(res.date)
            const hour = resDate.getHours()
            const durationHours = Math.ceil(res.duration / 60)

            // Distributed occupancy across booked hours
            for (let h = hour; h < hour + durationHours; h++) {
                if (h >= 12 && h <= 23) {
                    reservationHourlyLoad[h] += res.partySize
                }
            }
        })

        // 6. ML Model Synthesis
        // Assume maximum theoretical capacity based on peaks + a buffer
        const maxHistorical = Math.max(...Object.values(historicalHourlyTraffic)) || 10
        const maxReservations = Math.max(...Object.values(reservationHourlyLoad)) || 10
        const baselineCapacity = (maxHistorical + maxReservations) * 1.5 // 50% buffer
        const maxCapacity = Math.max(baselineCapacity, 50) // Minimum 50 pax assumption

        const prediction = []

        for (let hour = 12; hour <= 23; hour++) {
            const histWeight = historicalHourlyTraffic[hour] || 0
            const resWeight = reservationHourlyLoad[hour] || 0

            // Combine Reservations (exact) with Historical Walk-ins (estimated)
            // Divide historical by 4 because 30 days = ~4 specific days of week
            const estimatedWalkins = histWeight / 4

            const totalProjectedPax = resWeight + estimatedWalkins

            let occupancyPercentage = Math.round((totalProjectedPax / maxCapacity) * 100)
            if (occupancyPercentage > 100) occupancyPercentage = 100

            // Slight smoothing curve for restaurant typical flows (peaks at 14:00 and 20:00)
            // Just let the data speak if available, otherwise flat

            let status = 'Baja'
            if (occupancyPercentage >= 85) status = 'Lleno'
            else if (occupancyPercentage >= 60) status = 'Alta'
            else if (occupancyPercentage >= 30) status = 'Media'

            prediction.push({
                hour: `${hour.toString().padStart(2, '0')}:00`,
                occupancyPercentage,
                projectedPax: Math.round(totalProjectedPax),
                reservedPax: resWeight,
                status
            })
        }

        // Add 3 immediate predictions for the UI "Radar" view (Current hour + next 2)
        const currentHour = new Date().getHours()
        let activeHourIndex = prediction.findIndex(p => parseInt(p.hour) === currentHour)
        if (activeHourIndex === -1 && currentHour < 12) activeHourIndex = 0 // Show 12:00 if morning
        if (activeHourIndex === -1 && currentHour > 23) activeHourIndex = prediction.length - 1

        const immediateForecast = prediction.slice(activeHourIndex, activeHourIndex + 3)

        return NextResponse.json({
            fullDay: prediction,
            immediateForecast,
            overallTrend: immediateForecast.every(f => f.occupancyPercentage < 40) ? 'CAYENDO' : immediateForecast.some(f => f.occupancyPercentage > 80) ? 'SATURADO' : 'ESTABLE'
        })

    } catch (error) {
        console.error('[OCCUPANCY_API]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

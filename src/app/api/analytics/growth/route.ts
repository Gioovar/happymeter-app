import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    // Security: Only SUPER_ADMIN
    const user = await prisma.userSettings.findUnique({
        where: { userId },
        select: { role: true }
    })

    if (user?.role !== 'SUPER_ADMIN') {
        return new NextResponse('Forbidden', { status: 403 })
    }

    try {
        // 1. Total Revenue (All time)
        const totalSales = await prisma.sale.aggregate({
            _sum: { amount: true },
            where: { status: 'COMPLETED' }
        })
        const revenue = totalSales._sum.amount || 0

        // 2. Active Users (Count)
        const activeUsersCount = await prisma.userSettings.count({
            where: {
                // subscriptionStatus: 'active' // In early stage, maybe just all users?
                // Let's count all non-archived for now as "Users"
            }
        })

        // 3. New Users (Last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const newUsersCount = await prisma.userSettings.count({
            where: {
                createdAt: { gte: thirtyDaysAgo }
            }
        })

        // 4. Chart Data (Last 6 Months)
        // We'll generate a rough 6-month trend. 
        // Real implementation would group by month. For MVP we can do aggregate queries or simple date matching.
        // For efficiency in this "lite" version, we'll fetch sales of last 6 months and mapping in JS.

        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
        sixMonthsAgo.setDate(1) // Start of that month

        const sales = await prisma.sale.findMany({
            where: {
                createdAt: { gte: sixMonthsAgo },
                status: 'COMPLETED'
            },
            select: {
                createdAt: true,
                amount: true
            }
        })

        // Group by Month (Format: "Jan", "Feb")
        const monthsMap = new Map<string, number>()
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        // Initialize last 6 months with 0
        for (let i = 0; i < 6; i++) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const key = monthNames[d.getMonth()]
            monthsMap.set(key, 0)
        }

        sales.forEach(sale => {
            const month = monthNames[new Date(sale.createdAt).getMonth()]
            if (monthsMap.has(month)) {
                monthsMap.set(month, (monthsMap.get(month) || 0) + sale.amount)
            }
        })

        // Convert to array for Chart (reverse to show chronological)
        // Note: The above Map initialization order helps us just extracting. 
        // But Maps iterate in insertion order. Since we inserted current month first (i=0), it's reverse chrono.
        // Let's fix loop to be chronological:

        const chartData = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const key = monthNames[d.getMonth()]
            // Need to re-sum because the map filler was separate... actually let's just redo simpler.

            // Filter sales for this month
            const monthSales = sales.filter(s =>
                s.createdAt.getMonth() === d.getMonth() &&
                s.createdAt.getFullYear() === d.getFullYear()
            ).reduce((acc, curr) => acc + curr.amount, 0)

            chartData.push({
                name: key,
                revenue: monthSales,
                // We could also add "users" growth here if we fetched users with timestamps
                users: 0 // Placeholder or separate query
            })
        }

        // Calculate net growth
        const netGrowth = activeUsersCount - 0 // Simplify for MVP

        return NextResponse.json({
            metrics: {
                totalRevenue: revenue,
                totalNew: newUsersCount,
                totalChurn: 0,
                totalSurveys: 0, // Pending implementation
                netGrowth: netGrowth
            },
            chartData: chartData // Rename 'chart' to 'chartData' as expected by frontend
        })

    } catch (error) {
        console.error('Growth API Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

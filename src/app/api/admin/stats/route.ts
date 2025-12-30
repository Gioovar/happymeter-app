
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, subMonths, format } from 'date-fns'

// TODO: Move to a config or env var
const ADMIN_EMAILS = ['admin@happymeter.com', 'gioovar@gmail.com']

async function isAdmin() {
    const user = await currentUser()
    if (!user || !user.emailAddresses.some(email => ADMIN_EMAILS.includes(email.emailAddress))) {
        return false
    }
    return true
}

export async function GET() {
    try {
        if (!await isAdmin()) {
            return new NextResponse("Unauthorized", { status: 403 })
        }

        // 1. Calculate MRR based on Active Users and their Plans
        // Pricing constants (MXN)
        const PRICING = {
            'GROWTH': 499,
            'POWER': 1499,
            'CHAIN': 2999
        }

        const activeSubs = await prisma.userSettings.groupBy({
            by: ['plan'],
            where: {
                OR: [
                    { subscriptionStatus: 'active' },
                    { plan: { not: 'FREE' } } // Fallback if status is missing but plan is set
                ]
            },
            _count: true
        })

        let mrr = 0
        activeSubs.forEach(group => {
            const price = PRICING[group.plan as keyof typeof PRICING] || 0
            mrr += price * group._count
        })

        // 2. User Stats
        const totalUsers = await prisma.userSettings.count()

        // Active users: Created a survey in the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const activeUsersCount = await prisma.survey.groupBy({
            by: ['userId'],
            where: { createdAt: { gte: thirtyDaysAgo } }
        }).then(res => res.length)

        // 3. Financial Chart Data (Real Sales from 'Sale' table)
        // Group sales by month for the last 6 months
        const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5))

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

        const usersJoined = await prisma.userSettings.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true }
        })

        // Process data into monthly buckets
        const monthlyData = new Map<string, { revenue: number, users: number }>()

        // Initialize last 6 months
        for (let i = 0; i < 6; i++) {
            const d = subMonths(new Date(), i)
            const key = format(d, 'MMM') // e.g., "Dic"
            monthlyData.set(key, { revenue: 0, users: 0 })
        }

        sales.forEach(sale => {
            const key = format(sale.createdAt, 'MMM')
            if (monthlyData.has(key)) {
                const current = monthlyData.get(key)!
                current.revenue += sale.amount
                monthlyData.set(key, current)
            }
        })

        usersJoined.forEach(user => {
            const key = format(user.createdAt, 'MMM')
            if (monthlyData.has(key)) {
                const current = monthlyData.get(key)!
                current.users += 1
                monthlyData.set(key, current)
            }
        })

        // Convert Map to Array and reverse (Chronological order)
        // Note: Map iterates insertion order, but we want chronological.
        // Let's rebuild it cleanly.
        const chartData = []
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(new Date(), i)
            const key = format(d, 'MMM')
            const data = monthlyData.get(key) || { revenue: 0, users: 0 }
            chartData.push({
                name: key,
                revenue: data.revenue,
                users: data.users
            })
        }

        // 4. Recent Activity (Audit Logs + Recent Sales)
        // Combine logs and sales for a richer feed
        const recentLogs = await prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        })

        // If we want to show sales in the logs area, we'd need to map them, 
        // but for now let's keep the dashboard generic or add a "recent sales" section later.
        // The frontend expects 'recentLogs'.

        return NextResponse.json({
            mrr, // Now calculated dynamically
            totalUsers,
            activeUsers: activeUsersCount,
            inactiveUsers: totalUsers - activeUsersCount,
            chartData, // Now reflects real Sales and User Joins
            recentLogs
        })

    } catch (error) {
        console.error('[ADMIN_STATS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

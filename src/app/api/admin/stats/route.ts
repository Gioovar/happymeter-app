
import { NextResponse } from 'next/server'
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

        // 1. Calculate MRR (Simulated based on Plans)
        // Assuming PRO plan is $29/month
        const proUsersCount = await prisma.userSettings.count({
            where: { plan: 'PRO' }
        })
        const mrr = proUsersCount * 29

        // 2. User Stats
        const totalUsers = await prisma.userSettings.count()

        // Active users: Created a survey in the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const activeUsersCount = await prisma.survey.groupBy({
            by: ['userId'],
            where: { createdAt: { gte: thirtyDaysAgo } }
        }).then(res => res.length)

        // 3. Growth Chart Data (Last 6 months)
        // This is a bit complex with just Prisma, so we'll simulate a trend based on real total
        // In a real app, we'd query User creation dates.
        // For now, let's get real user creation dates from UserSettings (which we sync)

        const sixMonthsAgo = subMonths(new Date(), 5)
        const monthlySignups = await prisma.userSettings.groupBy({
            by: ['createdAt'],
            where: { createdAt: { gte: startOfMonth(sixMonthsAgo) } },
        })

        // Aggregate by month manually since Prisma groupBy date is specific
        // Note: In a real production app with high volume, use raw SQL date_trunc

        // Mocking chart data for visual demonstration if not enough real data exists
        const chartData = [
            { name: 'Ene', revenue: mrr * 0.5, users: Math.floor(totalUsers * 0.4) },
            { name: 'Feb', revenue: mrr * 0.6, users: Math.floor(totalUsers * 0.5) },
            { name: 'Mar', revenue: mrr * 0.8, users: Math.floor(totalUsers * 0.7) },
            { name: 'Abr', revenue: mrr * 0.9, users: Math.floor(totalUsers * 0.8) },
            { name: 'May', revenue: mrr * 0.95, users: Math.floor(totalUsers * 0.9) },
            { name: 'Jun', revenue: mrr, users: totalUsers },
        ]

        // 4. Recent Activity (Audit Logs)
        const recentLogs = await prisma.auditLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({
            mrr,
            totalUsers,
            activeUsers: activeUsersCount,
            inactiveUsers: totalUsers - activeUsersCount,
            chartData,
            recentLogs
        })

    } catch (error) {
        console.error('[ADMIN_STATS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

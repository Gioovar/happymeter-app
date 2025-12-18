import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') || '30d' // 30d, 90d, all

        // Date Logic
        const now = new Date()
        const startDate = new Date()
        if (range === '30d') startDate.setDate(now.getDate() - 30)
        else if (range === '90d') startDate.setDate(now.getDate() - 90)
        else if (range === '1y') startDate.setFullYear(now.getFullYear() - 1)
        else startDate.setFullYear(2000) // All time

        // 1. Income (Sales)
        const sales = await prisma.sale.findMany({
            where: {
                createdAt: { gte: startDate },
                status: { in: ['COMPLETED', 'PAID', 'succeeded'] }
            },
            select: { amount: true, createdAt: true }
        })

        const totalIncome = sales.reduce((acc: number, sale: { amount: number }) => acc + sale.amount, 0)

        // 2. Expenses (Commissions + Achievements)

        // A. Commissions
        const commissions = await prisma.commission.findMany({
            where: {
                createdAt: { gte: startDate }
            },
            select: { amount: true, status: true, createdAt: true }
        })

        // B. Creator Achievements (Monetary Rewards)
        const achievementsPromise = prisma.creatorAchievement.findMany({
            where: {
                awardedAt: { gte: startDate },
            },
            include: {
                achievement: {
                    select: { rewardAmount: true }
                }
            }
        })

        const [achievements] = await Promise.all([achievementsPromise])

        // Filter only those with reward > 0
        const monetaryAchievements = achievements.filter((a: any) => a.achievement.rewardAmount > 0)

        const totalCommissions = commissions.reduce((acc: number, c: { amount: number }) => acc + c.amount, 0)
        const totalRewards = monetaryAchievements.reduce((acc: number, a: any) => acc + a.achievement.rewardAmount, 0)

        const totalExpenses = totalCommissions + totalRewards

        const netProfit = totalIncome - totalExpenses

        // 3. Trends (grouped by day for chart)
        const dailyData: Record<string, { income: number, expenses: number }> = {}

        // Init days
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            dailyData[dateStr] = { income: 0, expenses: 0 }
        }

        sales.forEach(s => {
            const d = s.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (dailyData[d]) dailyData[d].income += s.amount
        })

        commissions.forEach(c => {
            const d = c.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (dailyData[d]) dailyData[d].expenses += c.amount
        })

        monetaryAchievements.forEach(a => {
            const d = a.awardedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            if (dailyData[d]) dailyData[d].expenses += a.achievement.rewardAmount
        })

        const trendData = Object.entries(dailyData).map(([date, vals]) => ({
            date,
            income: vals.income,
            expenses: vals.expenses
        }))

        // 4. Recent Transactions
        const recentSales = sales.slice(-5).map(s => ({ type: 'income', amount: s.amount, date: s.createdAt, label: 'Venta Plan' }))
        const recentCommissions = commissions.slice(-5).map(c => ({ type: 'expense', amount: c.amount, date: c.createdAt, label: 'Comisión Creador' }))

        const recentTransactions = [...recentSales, ...recentCommissions]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5)

        return NextResponse.json({
            income: totalIncome,
            expenses: totalExpenses,
            net: netProfit,
            breakdown: {
                commissions: totalCommissions,
                rewards: totalRewards
            },
            trend: trendData,
            recent: recentTransactions
        })

    } catch (error) {
        console.error('[FINANCIAL_API]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

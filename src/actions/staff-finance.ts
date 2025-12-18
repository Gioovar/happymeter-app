'use server'

import { prisma } from '@/lib/prisma'

export async function getRevenueStats() {
    // 1. Get total sales connected to affiliates
    // We need to find sales where the user was referred by an affiliate
    const referrals = await prisma.referral.findMany({
        where: {
            convertedAt: { not: null } // Only converted referrals count? Or just all links? Assuming converted/active
        },
        select: { referredUserId: true }
    })

    const referredUserIds = referrals.map(r => r.referredUserId)

    if (referredUserIds.length === 0) {
        return {
            totalGross: 0,
            agencyRevenue: 0, // 40% of gross
            totalPaidOut: 0,
            netAvailable: 0
        }
    }

    const sales = await prisma.sale.findMany({
        where: {
            userId: { in: referredUserIds },
            status: 'COMPLETED'
        }
    })

    const totalGross = sales.reduce((acc, sale) => acc + sale.amount, 0)
    const agencyRevenue = totalGross * 0.40 // 40% rule

    // 2. Get total payouts
    const payouts = await prisma.payout.findMany({
        where: {
            status: 'PAID'
        }
    })

    const totalPaidOut = payouts.reduce((acc, p) => acc + p.amount, 0)

    // 3. Get pending commissions (Liability)
    // We assume commissions are created when sales happen. If not, we might need to estimate.
    // For now, let's query the Commission table.
    const pendingCommissions = await prisma.commission.findMany({
        where: { status: 'PENDING' }
    })

    // If no specific commission records exist yet (legacy data), we might need a fallback, 
    // but assuming system generates them.
    const totalPendingToPay = pendingCommissions.reduce((acc, c) => acc + c.amount, 0)

    // Net Available = (Agency Revenue - Already Paid) - Pending Liability
    // The user said "from that 40% they pay creators". 
    // So distinct from Gross.
    const netAvailable = agencyRevenue - totalPaidOut - totalPendingToPay

    return {
        totalGross,
        agencyRevenue,
        totalPaidOut,
        totalPendingToPay,
        netAvailable: netAvailable > 0 ? netAvailable : 0
    }
}


export async function getRevenueAnalytics() {
    // Re-fetch sales as in getRevenueStats but we need dates
    const referrals = await prisma.referral.findMany({
        where: { convertedAt: { not: null } },
        select: { referredUserId: true }
    })
    const referredUserIds = referrals.map(r => r.referredUserId)

    if (referredUserIds.length === 0) return {
        chartData: [],
        comparisons: {
            daily: { current: 0, previous: 0, growth: 0 },
            weekly: { current: 0, previous: 0, growth: 0 },
            monthly: { current: 0, previous: 0, growth: 0 }
        }
    }

    const sales = await prisma.sale.findMany({
        where: {
            userId: { in: referredUserIds },
            status: 'COMPLETED'
        },
        orderBy: { createdAt: 'asc' }
    })

    // --- Helpers ---
    const now = new Date()
    const getStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const getStartOfYesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return getStartOfDay(d) }
    const getStartOfLastWeek = () => { const d = new Date(); d.setDate(d.getDate() - 7); return getStartOfDay(d) }

    // --- Comparisons ---
    let today = 0, yesterday = 0
    let thisWeek = 0, lastWeek = 0 // Approximate 7 days rolling
    let thisMonth = 0, lastMonth = 0 // Approximate 30 days rolling

    sales.forEach(sale => {
        const date = sale.createdAt
        const amount = sale.amount * 0.40 // Agency Share
        const timeDiff = now.getTime() - date.getTime()
        const daysDiff = timeDiff / (1000 * 3600 * 24)

        // Daily
        if (daysDiff < 1) today += amount
        else if (daysDiff >= 1 && daysDiff < 2) yesterday += amount

        // Weekly (Rolling 7 vs Previous 7)
        if (daysDiff < 7) thisWeek += amount
        else if (daysDiff >= 7 && daysDiff < 14) lastWeek += amount

        // Monthly (Rolling 30 vs Previous 30)
        if (daysDiff < 30) thisMonth += amount
        else if (daysDiff >= 30 && daysDiff < 60) lastMonth += amount
    })

    const calcGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
    }

    // --- Chart Data (Last 30 Days) ---
    const chartMap = new Map<string, number>()
    // Initialize last 30 days with 0
    for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        chartMap.set(d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }), 0)
    }

    sales.forEach(sale => {
        const date = sale.createdAt
        const timeDiff = now.getTime() - date.getTime()
        if (timeDiff / (1000 * 3600 * 24) <= 30) {
            const key = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
            const current = chartMap.get(key) || 0
            chartMap.set(key, current + (sale.amount * 0.40))
        }
    })

    const chartData = Array.from(chartMap.entries()).map(([date, value]) => ({ date, value }))

    return {
        comparisons: {
            daily: { current: today, previous: yesterday, growth: calcGrowth(today, yesterday) },
            weekly: { current: thisWeek, previous: lastWeek, growth: calcGrowth(thisWeek, lastWeek) },
            monthly: { current: thisMonth, previous: lastMonth, growth: calcGrowth(thisMonth, lastMonth) }
        },
        chartData
    }
}

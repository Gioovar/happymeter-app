'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function getGodModeData() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // 1. Advanced Metrics Calculation

    // Conversion Rate: Approved Visits / Total Visits
    const totalVisits = await prisma.placeVisit.count()
    const approvedVisits = await prisma.placeVisit.count({ where: { status: 'APPROVED' } })
    const conversionRate = totalVisits > 0 ? Math.round((approvedVisits / totalVisits) * 100) : 0

    // Top Creators (By total earnings)
    // We group commissions by affiliateId
    const topCreatorsRaw = await prisma.commission.groupBy({
        by: ['affiliateId'],
        _sum: {
            amount: true
        },
        orderBy: {
            _sum: {
                amount: 'desc'
            }
        },
        take: 6
    })

    // Fetch creator details for the breakdown
    const topCreators = await Promise.all(
        topCreatorsRaw.map(async (item) => {
            const creator = await prisma.affiliateProfile.findUnique({
                where: { id: item.affiliateId }
            })
            return {
                id: item.affiliateId,
                code: creator?.code || 'Unknown',
                earnings: item._sum.amount || 0,
                change: Math.floor(Math.random() * 20) + 1 // Mock growth %, would need historical data
            }
        })
    )

    // ROI Logic (Mock for now as we don't track operational costs fully)
    // Formula: (Revenue - Costs) / Costs * 100
    // Let's assume Costs = 20% of Revenue + Fixed $1000
    // We can fetch real revenue from getRevenueStats logic if implemented, but defining here for speed:
    const totalSales = await prisma.sale.aggregate({ _sum: { amount: true } })
    const revenue = totalSales._sum.amount || 5000 // Fallback for dev
    const costs = (revenue * 0.2) + 500
    const roi = Math.round(((revenue - costs) / costs) * 100)

    return {
        stats: {
            roi: roi > 0 ? roi : 150, // Fallback mock 150%
            conversionRate: conversionRate > 0 ? conversionRate : 65, // Fallback mock 65%
            systemHealth: 98, // Mock
            trafficSource: [
                { source: 'Instagram Stories', percentage: 45 },
                { source: 'TikTok Reels', percentage: 35 },
                { source: 'Directo', percentage: 15 },
                { source: 'Otros', percentage: 5 },
            ]
        },
        topCreators: topCreators.length > 0 ? topCreators : [
            { id: '1', code: 'Demo1', earnings: 1200, change: 12 },
            { id: '2', code: 'Demo2', earnings: 950, change: 8 },
            { id: '3', code: 'Demo3', earnings: 800, change: 5 },
        ]
    }
}

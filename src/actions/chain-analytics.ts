'use server'

import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export type GlobalChainMetrics = {
    totalSurveys: number
    totalRedemptions: number
    totalReservations: number
    totalCustomers: number
    globalNps: number
    branchBreakdown: BranchMetric[]
    satisfactionTrend: TrendDataPoint[]
}

export type BranchMetric = {
    branchId: string
    name: string
    surveys: number
    redemptions: number
    reservations: number
    customers: number
    nps: number
    color?: string
}

export type TrendDataPoint = {
    date: string
    [branchId: string]: number | string
}

const COLORS = [
    '#8b5cf6', // Violet
    '#f43f5e', // Rose
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#84cc16', // Lime
]

export async function getChainAnalytics(chainId: string): Promise<GlobalChainMetrics | null> {
    const user = await currentUser()
    if (!user) return null

    // Verify ownership
    const chain = await prisma.chain.findUnique({
        where: { id: chainId },
        include: {
            branches: {
                include: {
                    branch: {
                        select: {
                            userId: true,
                            businessName: true
                        }
                    }
                }
            }
        }
    })

    if (!chain || chain.ownerId !== user.id) return null

    const branchIds = chain.branches.map(b => b.branchId)
    const branchesMap = new Map(chain.branches.map(b => [b.branchId, b.name || b.branch.businessName || 'Sucursal']))

    // 1. Total Surveys & NPS 
    const surveys = await prisma.survey.findMany({
        where: { userId: { in: branchIds } },
        select: {
            userId: true,
            responses: {
                select: {
                    answers: {
                        where: {
                            question: {
                                type: 'NPS'
                            }
                        },
                        select: { value: true }
                    }
                }
            },
            _count: {
                select: { responses: true }
            }
        }
    })

    // 2. Redemptions
    const redemptions = await prisma.loyaltyRedemption.findMany({
        where: {
            program: { userId: { in: branchIds } }
        },
        select: {
            program: { select: { userId: true } }
        }
    })

    // 3. Reservations 
    const reservations = await prisma.reservation.findMany({
        where: {
            table: { floorPlan: { userId: { in: branchIds } } }
        },
        include: {
            table: {
                include: {
                    floorPlan: {
                        select: { userId: true }
                    }
                }
            }
        }
    })

    // 4. Customers 
    const customers = await prisma.loyaltyCustomer.findMany({
        where: {
            program: { userId: { in: branchIds } }
        },
        select: {
            phone: true,
            program: { select: { userId: true } }
        }
    })

    // 5. Satisfaction Trends (Last 30 Days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const trendResponses = await prisma.response.findMany({
        where: {
            survey: { userId: { in: branchIds } },
            createdAt: { gte: thirtyDaysAgo }
        },
        select: {
            createdAt: true,
            survey: { select: { userId: true } },
            answers: {
                where: { question: { type: 'NPS' } },
                select: { value: true }
            }
        },
        orderBy: { createdAt: 'asc' }
    })

    // Process Trend Data
    const dateMap = new Map<string, Record<string, { sum: number, count: number }>>()

    // Initialize dates
    for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD
        dateMap.set(dateStr, {})
        // Init all branches for this date? Optional, Recharts handles missing keys gracefully.
    }

    trendResponses.forEach(r => {
        const dateStr = r.createdAt.toISOString().split('T')[0]
        const bId = r.survey.userId
        const value = parseInt(r.answers[0]?.value)

        if (!isNaN(value)) {
            const entry = dateMap.get(dateStr)
            if (entry) { // Only process if within the mapped range
                if (!entry[bId]) entry[bId] = { sum: 0, count: 0 }
                entry[bId].sum += value
                entry[bId].count += 1
            }
        }
    })

    const chartData: TrendDataPoint[] = Array.from(dateMap.entries()).map(([date, branches]) => {
        const point: TrendDataPoint = { date }
        Object.entries(branches).forEach(([bId, stats]) => {
            // Average Score (0-10)
            point[bId] = parseFloat((stats.sum / stats.count).toFixed(1))
        })
        return point
    })

    // Process Metrics Per Branch
    const branchMetrics: BranchMetric[] = chain.branches.map((b, idx) => {
        const bId = b.branchId

        // Surveys
        const branchSurveys = surveys.filter(s => s.userId === bId)
        const totalSurveys = branchSurveys.reduce((acc, s) => acc + s._count.responses, 0)

        // NPS Calculation
        const npsValues = branchSurveys.flatMap(s => s.responses.flatMap(r => r.answers.map(a => parseInt(a.value) || 0)))
        let npsScore = 0
        if (npsValues.length > 0) {
            const promoters = npsValues.filter(v => v >= 9).length
            const detractors = npsValues.filter(v => v <= 6).length
            npsScore = Math.round(((promoters - detractors) / npsValues.length) * 100)
        }

        const branchRedemptions = redemptions.filter(r => r.program.userId === bId).length
        const branchReservations = reservations.filter(r => r.table?.floorPlan?.userId === bId).length
        const branchCustomers = customers.filter(c => c.program.userId === bId).length

        return {
            branchId: bId,
            name: branchesMap.get(bId) || 'Sucursal',
            surveys: totalSurveys,
            redemptions: branchRedemptions,
            reservations: branchReservations,
            customers: branchCustomers,
            nps: npsScore,
            color: COLORS[idx % COLORS.length] // Assign color based on index
        }
    })

    // Global Totals
    const totalSurveys = branchMetrics.reduce((acc, b) => acc + b.surveys, 0)
    const totalRedemptions = branchMetrics.reduce((acc, b) => acc + b.redemptions, 0)
    const totalReservations = branchMetrics.reduce((acc, b) => acc + b.reservations, 0)

    const uniquePhones = new Set(customers.map(c => c.phone))
    const totalCustomers = uniquePhones.size

    const allNpsValues = surveys.flatMap(s => s.responses.flatMap(r => r.answers.map(a => parseInt(a.value) || 0)))
    let globalNps = 0
    if (allNpsValues.length > 0) {
        const promoters = allNpsValues.filter(v => v >= 9).length
        const detractors = allNpsValues.filter(v => v <= 6).length
        globalNps = Math.round(((promoters - detractors) / allNpsValues.length) * 100)
    }

    return {
        totalSurveys,
        totalRedemptions,
        totalReservations,
        totalCustomers,
        globalNps,
        branchBreakdown: branchMetrics,
        satisfactionTrend: chartData
    }
}

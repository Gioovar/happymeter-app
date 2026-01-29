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

// Helper to normalize score to 0-10
function normalizeScore(value: string, type: string): number | null {
    const val = parseInt(value)
    if (isNaN(val)) return null

    if (type === 'NPS') return val
    if (['RATING', 'SMILEY', 'STAR'].includes(type)) return val * 2 // Map 5 to 10

    // Fallback for others?
    return null
}

export async function getChainAnalytics(chainId: string): Promise<GlobalChainMetrics | null> {
    const user = await currentUser()
    if (!user) return null

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

    // 1. Total Surveys & Satisfaction Data
    // Fetch answers for ANY satisfaction type
    const surveys = await prisma.survey.findMany({
        where: { userId: { in: branchIds } },
        select: {
            userId: true,
            responses: {
                select: {
                    answers: {
                        where: {
                            question: {
                                type: { in: ['NPS', 'RATING', 'SMILEY', 'STAR'] }
                            }
                        },
                        select: {
                            value: true,
                            question: { select: { type: true } }
                        }
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
        where: { program: { userId: { in: branchIds } } },
        select: { program: { select: { userId: true } } }
    })

    // 3. Reservations 
    const reservations = await prisma.reservation.findMany({
        where: { table: { floorPlan: { userId: { in: branchIds } } } },
        include: {
            table: {
                include: {
                    floorPlan: { select: { userId: true } }
                }
            }
        }
    })

    // 4. Customers 
    const customers = await prisma.loyaltyCustomer.findMany({
        where: { program: { userId: { in: branchIds } } },
        select: { phone: true, program: { select: { userId: true } } }
    })

    // 5. Trends
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
                where: {
                    question: {
                        type: { in: ['NPS', 'RATING', 'SMILEY', 'STAR'] }
                    }
                },
                select: {
                    value: true,
                    question: { select: { type: true } }
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    })

    // Process Trend Data
    const dateMap = new Map<string, Record<string, { sum: number, count: number }>>()
    for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        const dateStr = d.toISOString().split('T')[0]
        dateMap.set(dateStr, {})
    }

    trendResponses.forEach(r => {
        const dateStr = r.createdAt.toISOString().split('T')[0]
        const bId = r.survey.userId

        // Find the first satisfaction answer
        const answer = r.answers[0]
        if (answer) {
            const score = normalizeScore(answer.value, answer.question.type)
            if (score !== null) {
                const entry = dateMap.get(dateStr)
                if (entry) {
                    if (!entry[bId]) entry[bId] = { sum: 0, count: 0 }
                    entry[bId].sum += score
                    entry[bId].count += 1
                }
            }
        }
    })

    const chartData: TrendDataPoint[] = Array.from(dateMap.entries()).map(([date, branches]) => {
        const point: TrendDataPoint = { date }
        Object.entries(branches).forEach(([bId, stats]) => {
            point[bId] = parseFloat((stats.sum / stats.count).toFixed(1))
        })
        return point
    })

    // Process Metrics Per Branch
    const branchMetrics: BranchMetric[] = chain.branches.map((b, idx) => {
        const bId = b.branchId

        const branchSurveys = surveys.filter(s => s.userId === bId)
        const totalSurveys = branchSurveys.reduce((acc, s) => acc + s._count.responses, 0)

        // NPS Calculation (Normalized)
        const scores = branchSurveys.flatMap(s => s.responses.flatMap(r => r.answers
            .map(a => normalizeScore(a.value, a.question.type))
            .filter((v): v is number => v !== null)
        ))

        let npsScore = 0
        if (scores.length > 0) {
            const promoters = scores.filter(v => v >= 9).length
            const detractors = scores.filter(v => v <= 6).length
            npsScore = Math.round(((promoters - detractors) / scores.length) * 100)
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
            color: COLORS[idx % COLORS.length]
        }
    })

    const totalSurveys = branchMetrics.reduce((acc, b) => acc + b.surveys, 0)
    const totalRedemptions = branchMetrics.reduce((acc, b) => acc + b.redemptions, 0)
    const totalReservations = branchMetrics.reduce((acc, b) => acc + b.reservations, 0)
    const uniquePhones = new Set(customers.map(c => c.phone))
    const totalCustomers = uniquePhones.size

    // Global NPS with normalized scores
    const allScores = surveys.flatMap(s => s.responses.flatMap(r => r.answers
        .map(a => normalizeScore(a.value, a.question.type))
        .filter((v): v is number => v !== null)
    ))

    let globalNps = 0
    if (allScores.length > 0) {
        const promoters = allScores.filter(v => v >= 9).length
        const detractors = allScores.filter(v => v <= 6).length
        globalNps = Math.round(((promoters - detractors) / allScores.length) * 100)
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

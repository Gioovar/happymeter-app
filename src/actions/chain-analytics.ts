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
    volumeTrend: TrendDataPoint[]
}

export type BranchMetric = {
    branchId: string
    name: string
    businessName?: string
    surveys: number
    redemptions: number
    reservations: number
    customers: number
    staff: number
    staffFeedback: number
    nps: number
    color?: string
    periods: {
        today: PeriodMetrics
        week: PeriodMetrics
        month: PeriodMetrics
    }
}

export type PeriodMetrics = {
    surveys: number
    reservations: number
    rating: number
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
    if (['RATING', 'SMILEY', 'STAR', 'EMOJI'].includes(type)) return val * 2 // Map 5 to 10

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
    const branchesMap = new Map(chain.branches.map(b => {
        let name = b.name;
        // Fix for "Sede Principal" -> use Business Name
        if (!name || name === 'Sede Principal' || name === 'Sede principal') {
            name = b.branch.businessName || name || 'Sucursal';
        }
        return [b.branchId, name];
    }))

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
                                type: { in: ['NPS', 'RATING', 'SMILEY', 'STAR', 'EMOJI'] }
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
    // 5. Staff
    const staffMembers = await prisma.teamMember.findMany({
        where: { ownerId: { in: branchIds }, isActive: true },
        select: { ownerId: true }
    })

    // 6. Staff Feedback (Complaints/Suggestions)
    const staffFeedback = await prisma.survey.findMany({
        where: { userId: { in: branchIds }, type: 'STAFF' },
        select: {
            userId: true,
            _count: {
                select: { responses: true }
            }
        }
    })

    // 7. Trends
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
                        type: { in: ['NPS', 'RATING', 'SMILEY', 'STAR', 'EMOJI'] }
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

        // Find any valid satisfaction answer
        const answer = r.answers.find(a => ['NPS', 'RATING', 'SMILEY', 'STAR', 'EMOJI'].includes(a.question.type))

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

        // Ensure all branches have a value (0 if no data) to create valid "Area" shapes
        branchIds.forEach(bId => {
            const stats = branches[bId]
            if (stats && stats.count > 0) {
                point[bId] = parseFloat((stats.sum / stats.count).toFixed(1))
            } else {
                point[bId] = 0 // Default to 0 to create "wave" from baseline
            }
        })

        return point
    })

    const volumeChartData: TrendDataPoint[] = Array.from(dateMap.entries()).map(([date, branches]) => {
        const point: TrendDataPoint = { date }

        branchIds.forEach(bId => {
            const stats = branches[bId]
            if (stats) {
                point[bId] = stats.count // Raw Count
            } else {
                point[bId] = 0
            }
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
        const branchStaff = staffMembers.filter(m => m.ownerId === bId).length
        const branchFeedback = staffFeedback.filter(s => s.userId === bId).reduce((acc, s) => acc + s._count.responses, 0)

        // Time-based filtering helpers
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const calcMetrics = (fromDate: Date): PeriodMetrics => {
            // Filter Surveys


            // Let's use trendResponses for this specific calculation to be safe and accurate on time.
            // Note: trendResponses is restricted to 30 days in the query (line 136). So it covers Today, Week, Month.
            const periodResponses = trendResponses.filter(r => r.survey.userId === bId && new Date(r.createdAt) >= fromDate)

            const count = periodResponses.length

            // Calc Average Rating (0-5 scale)
            // Reuse normalizeScore but map to 5 scale
            const scores = periodResponses.flatMap(r => r.answers
                .map(a => {
                    const val = normalizeScore(a.value, a.question.type) // returns 0-10
                    return val !== null ? val / 2 : null // Convert 0-10 to 0-5
                })
                .filter((v): v is number => v !== null)
            )
            const avgRating = scores.length > 0
                ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
                : 0

            // Filter Reservations
            // Reservations query (line 117) fetches all. We need to check 'date' field.
            // We assume 'reservations' variable has date field. The Prisma query included 'table', but we need 'date' from Reservation itself.
            // I need to update the reservation query (line 117) to select 'date' or just rely on default include.
            // Default include fetches scalars, so 'date' should be there.
            const periodReservations = reservations.filter(r =>
                r.table?.floorPlan?.userId === bId && new Date(r.date) >= fromDate
            ).length

            return {
                surveys: count,
                reservations: periodReservations,
                rating: avgRating
            }
        }

        return {
            branchId: bId,
            name: branchesMap.get(bId) || 'Sucursal',
            businessName: b.branch.businessName || undefined,
            surveys: totalSurveys,
            redemptions: branchRedemptions,
            reservations: branchReservations,
            customers: branchCustomers,
            staff: branchStaff,
            staffFeedback: branchFeedback,
            nps: npsScore,
            color: COLORS[idx % COLORS.length],
            periods: {
                today: calcMetrics(startOfDay),
                week: calcMetrics(startOfWeek),
                month: calcMetrics(startOfMonth)
            }
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
        satisfactionTrend: chartData,
        volumeTrend: volumeChartData
    }
}

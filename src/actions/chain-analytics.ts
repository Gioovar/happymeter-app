'use server'

import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export type GlobalChainMetrics = {
    totalSurveys: number
    totalRedemptions: number
    totalReservations: number
    totalCustomers: number
    globalNps: number // Derived from satisfaction
    branchBreakdown: BranchMetric[]
}

export type BranchMetric = {
    branchId: string
    name: string
    surveys: number
    redemptions: number
    reservations: number
    customers: number
    nps: number
}

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

    // 1. Total Surveys & NPS (Approximate)
    // We fetch counts grouped by survey -> userId
    const surveys = await prisma.survey.findMany({
        where: { userId: { in: branchIds } },
        select: {
            userId: true,
            responses: {
                select: {
                    answers: {
                        where: {
                            question: {
                                type: 'NPS' // Assuming standard NPS question type
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

    // 3. Reservations - FIXED: Use include to ensure typing works
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

    // 4. Customers (Unique Phones Global & Per Branch)
    const customers = await prisma.loyaltyCustomer.findMany({
        where: {
            program: { userId: { in: branchIds } }
        },
        select: {
            phone: true,
            program: { select: { userId: true } }
        }
    })

    // Process Metrics Per Branch
    const branchMetrics: BranchMetric[] = chain.branches.map(b => {
        const bId = b.branchId

        // Surveys
        const branchSurveys = surveys.filter(s => s.userId === bId)
        const totalSurveys = branchSurveys.reduce((acc, s) => acc + s._count.responses, 0)

        // NPS Calculation
        // Flatten all NPS answers for this branch
        const npsValues = branchSurveys.flatMap(s => s.responses.flatMap(r => r.answers.map(a => parseInt(a.value) || 0)))
        let npsScore = 0
        if (npsValues.length > 0) {
            const promoters = npsValues.filter(v => v >= 9).length
            const detractors = npsValues.filter(v => v <= 6).length
            npsScore = Math.round(((promoters - detractors) / npsValues.length) * 100)
        }

        // Redemptions
        const branchRedemptions = redemptions.filter(r => r.program.userId === bId).length

        // Reservations
        const branchReservations = reservations.filter(r => r.table?.floorPlan?.userId === bId).length

        // Customers
        const branchCustomers = customers.filter(c => c.program.userId === bId).length

        return {
            branchId: bId,
            name: branchesMap.get(bId) || 'Sucursal',
            surveys: totalSurveys,
            redemptions: branchRedemptions,
            reservations: branchReservations,
            customers: branchCustomers, // This is registered per branch
            nps: npsScore
        }
    })

    // Global Totals
    const totalSurveys = branchMetrics.reduce((acc, b) => acc + b.surveys, 0)
    const totalRedemptions = branchMetrics.reduce((acc, b) => acc + b.redemptions, 0)
    const totalReservations = branchMetrics.reduce((acc, b) => acc + b.reservations, 0)

    // Unique Global Customers (Dedup by phone)
    const uniquePhones = new Set(customers.map(c => c.phone))
    const totalCustomers = uniquePhones.size

    // Global NPS (Weighted by response count? Or total pool?)
    // Total Pool is better
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
        branchBreakdown: branchMetrics
    }
}

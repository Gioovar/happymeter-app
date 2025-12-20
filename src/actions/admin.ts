'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'
import { es } from 'date-fns/locale'

// TODO: stricter role check
async function checkAdmin() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')
    if (!userId) throw new Error('Unauthorized')
    return userId
}

export async function getGlobalAnalytics() {
    await checkAdmin()

    // 1. Total Counts
    const totalUsers = await prisma.userSettings.count()
    const totalResponses = await prisma.response.count()
    const activeSurveys = await prisma.survey.count()

    // 2. Growth (Last 30 Days)
    const today = new Date()
    const thirtyDaysAgo = subDays(today, 30)

    // Fetch only dates for aggregation to save bandwidth
    const newUsers = await prisma.userSettings.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
    })

    const newResponses = await prisma.response.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true }
    })

    // Aggregate by day
    const chartMap = new Map<string, { users: number, responses: number }>()

    // Initialize map with 0s for all days
    for (let i = 29; i >= 0; i--) {
        const date = subDays(today, i)
        const key = format(date, 'MMM dd', { locale: es })
        chartMap.set(key, { users: 0, responses: 0 })
    }

    // Fill with data
    newUsers.forEach(u => {
        const key = format(new Date(u.createdAt), 'MMM dd', { locale: es })
        if (chartMap.has(key)) {
            const entry = chartMap.get(key)!
            entry.users++
        }
    })

    newResponses.forEach(r => {
        const key = format(new Date(r.createdAt), 'MMM dd', { locale: es })
        if (chartMap.has(key)) {
            const entry = chartMap.get(key)!
            entry.responses++
        }
    })

    const last30Days = Array.from(chartMap.entries()).map(([date, data]) => ({
        date,
        users: data.users,
        responses: data.responses
    }))

    // 3. Token Estimate (Mock for now, but scalable)
    const tokens = [
        { name: 'GPT-4o', value: Math.floor(Math.random() * 50000) + 20000 },
        { name: 'GPT-3.5', value: Math.floor(Math.random() * 100000) + 50000 },
        { name: 'Embedding', value: Math.floor(Math.random() * 80000) + 40000 },
    ]

    return {
        metrics: {
            totalUsers,
            totalResponses,
            activeSurveys
        },
        last30Days,
        tokens
    }
}

export async function getTenants(query?: string) {
    await checkAdmin()

    const tenants = await prisma.userSettings.findMany({
        where: query ? {
            OR: [
                { userId: { contains: query, mode: 'insensitive' } },
                { businessName: { contains: query, mode: 'insensitive' } },
                { industry: { contains: query, mode: 'insensitive' } },
            ]
        } : undefined,
        orderBy: { createdAt: 'desc' },

        take: 50
    })

    // Manual count fetching because of missing relation in Prisma (userId is just a string in Survey)
    // This is N+1 but acceptable for Admin MVP with < 50 items per page
    const tenantsWithStats = await Promise.all(tenants.map(async (t) => {
        const surveyCount = await prisma.survey.count({ where: { userId: t.userId } })
        const responseCount = await prisma.response.count({
            where: { survey: { userId: t.userId } }
        })

        return {
            ...t,
            stats: {
                surveys: surveyCount,
                responses: responseCount
            }
        }
    }))

    return tenantsWithStats
}

export async function updateTenantPlan(userId: string, newPlan: string) {
    await checkAdmin()

    // Validate plans
    const VALID_PLANS = ['FREE', 'GROWTH', 'POWER', 'CHAIN', 'ENTERPRISE']
    if (!VALID_PLANS.includes(newPlan)) throw new Error('Invalid Plan')

    await prisma.userSettings.update({
        where: { userId },
        data: { plan: newPlan }
    })

    return { success: true }
}

export async function getSubscriptions() {
    await checkAdmin()

    // Fetch users who have a stripeCustomerId or non-free plan
    const subs = await prisma.userSettings.findMany({
        where: {
            OR: [
                { stripeCustomerId: { not: null } },
                { plan: { not: 'FREE' } }
            ]
        },
        select: {
            userId: true,
            businessName: true,
            plan: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            subscriptionStatus: true,
            subscriptionPeriodEnd: true,
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    })

    return subs
}

export interface CreatorExtended {
    id: string
    userId: string
    code: string
    balance: number
    commissionRate: number
    status: string // Ensure this matches schema (added recently)
    paypalEmail: string | null
    createdAt: Date
    stats: {
        totalReferrals: number
        activeReferrals: number // Converted or Active Subscription
        totalSalesAmount: number
        commissionPending: number
        commissionPaid: number
    }
}

export async function getCreatorsExtended() {
    await checkAdmin()

    // 1. Fetch Affiliates with relations
    const affiliates = await prisma.affiliateProfile.findMany({
        include: {
            referrals: true,
            commissions: true
        },
        orderBy: { balance: 'desc' }
    })

    // 2. Fetch all sales related to these referrals to calculate Total Sales Amount
    // We need a map of referredUserId -> Total Sales Amount
    const allReferredUserIds = affiliates.flatMap(a => a.referrals.map(r => r.referredUserId))

    const sales = await prisma.sale.findMany({
        where: { userId: { in: allReferredUserIds } },
        select: { userId: true, amount: true }
    })

    const salesMap = new Map<string, number>()
    sales.forEach(s => {
        salesMap.set(s.userId, (salesMap.get(s.userId) || 0) + s.amount)
    })

    // 3. Aggregate data
    const extendedCreators: CreatorExtended[] = affiliates.map(aff => {
        const totalReferrals = aff.referrals.length

        // Count active referrals (CONVERTED status)
        const activeReferrals = aff.referrals.filter(r => r.status === 'CONVERTED').length

        // Calculate Total Sales generated by this affiliate's referrals
        let totalSalesAmount = 0
        aff.referrals.forEach(r => {
            totalSalesAmount += salesMap.get(r.referredUserId) || 0
        })

        // Commission stats
        const commissionPending = aff.commissions
            .filter(c => c.status === 'PENDING')
            .reduce((sum, c) => sum + c.amount, 0)

        const commissionPaid = aff.commissions
            .filter(c => c.status === 'PAID')
            .reduce((sum, c) => sum + c.amount, 0)

        // Ensure status field exists (it was added to schema recently, handling potential undefined if type not regen perfectly yet at runtime, though we did push)
        // casting to any to avoid TS error if types are stale, but at runtime it should be there.
        const status = (aff as any).status || 'ACTIVE'

        return {
            id: aff.id,
            userId: aff.userId,
            code: aff.code,
            balance: aff.balance,
            commissionRate: (aff as any).commissionRate || 40.0, // Fallback if schema update latency
            status,
            paypalEmail: aff.paypalEmail,
            createdAt: aff.createdAt,
            stats: {
                totalReferrals,
                activeReferrals,
                totalSalesAmount,
                commissionPending,
                commissionPaid
            }
        }
    })

    return extendedCreators
}

export async function getCreator(userId: string) {
    await checkAdmin()

    const affiliate = await prisma.affiliateProfile.findUnique({
        where: { userId },
        include: {
            referrals: {
                orderBy: { createdAt: 'desc' }
            },
            commissions: {
                orderBy: { createdAt: 'desc' }
            },
            payouts: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!affiliate) return null

    // Calculate detailed stats similar to extended list but specifically for this user

    // 1. Sales
    const referredUserIds = affiliate.referrals.map(r => r.referredUserId)
    const sales = await prisma.sale.findMany({
        where: { userId: { in: referredUserIds } },
        orderBy: { createdAt: 'desc' }
    })

    const totalSalesAmount = sales.reduce((sum, s) => sum + s.amount, 0)

    // 2. Active Referrals
    const activeReferrals = affiliate.referrals.filter(r => r.status === 'CONVERTED').length

    // 3. Commission Stats
    const commissionPending = affiliate.commissions
        .filter(c => c.status === 'PENDING')
        .reduce((sum, c) => sum + c.amount, 0)

    const commissionPaid = affiliate.commissions
        .filter(c => c.status === 'PAID')
        .reduce((sum, c) => sum + c.amount, 0)

    return {
        ...affiliate,
        stats: {
            totalReferrals: affiliate.referrals.length,
            activeReferrals,
            totalSalesAmount,
            commissionPending,
            commissionPaid
        },
        salesHistory: sales // Returning detailed sales list for graphs if needed
    }
}

export async function getAuditLogs() {
    await checkAdmin()

    // Check if model exists first (handled by try/catch in component if needed, but assuming schema is synced)
    // Using prisma.auditLog if available
    try {
        const logs = await prisma.auditLog.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' }
        })
        return logs
    } catch (e) {
        console.error("AuditLog model likely missing or empty", e)
        return []
    }
}

export async function getSystemSettings() {
    await checkAdmin()

    let settings = await prisma.systemSettings.findFirst()

    if (!settings) {
        settings = await prisma.systemSettings.create({
            data: {
                maintenanceMode: false,
                allowNewSignups: true
            }
        })
    }

    return settings
}

export async function updateSystemSettings(data: { maintenanceMode: boolean; allowNewSignups: boolean }) {
    await checkAdmin()

    const settings = await prisma.systemSettings.findFirst()

    if (settings) {
        await prisma.systemSettings.update({
            where: { id: settings.id },
            data
        })
    }

    // Log the action
    const { userId } = await auth()
    if (userId) {
        try {
            await prisma.auditLog.create({
                data: {
                    action: 'UPDATE_SYSTEM_SETTINGS',
                    details: {
                        maintenance: data.maintenanceMode,
                        signups: data.allowNewSignups
                    },
                    adminId: userId
                }
            })
        } catch (e) {
            // ignore log error
            console.error(e)
        }
    }

    return { success: true }
}

export async function updateCreatorCommission(id: string, rate: number) {
    await checkAdmin()

    await prisma.affiliateProfile.update({
        where: { id },
        data: { commissionRate: rate }
    })

    return { success: true }
}

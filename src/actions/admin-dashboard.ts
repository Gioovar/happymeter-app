'use server'

import { prisma } from '@/lib/prisma'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// --- Authorization Helper ---
async function verifySuperAdmin() {
    const user = await currentUser()
    if (!user) throw new Error('Unauthorized')

    const dbUser = await prisma.userSettings.findUnique({
        where: { userId: user.id }
    })

    const isGod = dbUser?.role === 'SUPER_ADMIN' ||
        user.emailAddresses.some(e => ['armelzuniga87@gmail.com', 'gioovar@gmail.com', 'gtrendy2017@gmail.com'].includes(e.emailAddress));

    if (!isGod) {
        throw new Error('Restricted to Super Admins only')
    }

    return user
}

// --- Global Statistics ---
export async function getGlobalStats() {
    try {
        await verifySuperAdmin()

        const [
            totalUsers,
            activeUsers,
            totalSurveys,
            totalResponses,
            totalChains,
            totalBranches
        ] = await Promise.all([
            prisma.userSettings.count(),
            prisma.userSettings.count({ where: { subscriptionStatus: 'active' } }),
            prisma.survey.count(),
            prisma.response.count(),
            prisma.chain.count(),
            prisma.chainBranch.count()
        ])

        // Calculate growth (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const newUsers = await prisma.userSettings.count({
            where: { createdAt: { gte: thirtyDaysAgo } }
        })

        return {
            users: { total: totalUsers, active: activeUsers, newLast30Days: newUsers },
            usage: { surveys: totalSurveys, responses: totalResponses },
            network: { chains: totalChains, branches: totalBranches }
        }
    } catch (error: any) {
        console.error('Error fetching global stats:', error)
        throw new Error(error.message)
    }
}

// --- Financial Metrics ---
export async function getFinancialStats() {
    try {
        await verifySuperAdmin()

        // Get all active subscriptions with their plan
        const subscribers = await prisma.userSettings.findMany({
            where: {
                subscriptionStatus: 'active',
                plan: { not: 'FREE' }
            },
            select: { plan: true, stripeCustomerId: true }
        })

        // Approximate MRR based on Plan Pricing (Hardcoded for speed, can be dynamic later)
        // Pricing Map: STARTER=$29, GROWTH=$49, POWER=$99, CHAIN=$149, ENTERPRISE=$499
        const pricingMap: Record<string, number> = {
            'FREE': 0,
            'STARTER': 29,
            'GROWTH': 49,
            'POWER': 99,
            'CHAIN': 149,
            'ENTERPRISE': 499
        }

        let mrr = 0
        const breakdown: Record<string, number> = {}

        subscribers.forEach((sub: any) => {
            const price = pricingMap[sub.plan] || 0
            mrr += price
            breakdown[sub.plan] = (breakdown[sub.plan] || 0) + 1
        })

        const arr = mrr * 12

        return {
            mrr,
            arr,
            activeSubscribers: subscribers.length,
            planBreakdown: breakdown
        }
    } catch (error: any) {
        console.error('Error fetching financial stats:', error)
        throw new Error(error.message)
    }
}

// --- Detailed Financials ---
export async function getDetailedFinancials() {
    try {
        await verifySuperAdmin()

        // 1. Churn Analysis: Users who canceled
        const canceledUsers = await prisma.userSettings.count({
            where: { subscriptionStatus: 'canceled' }
        })

        const totalEverSubscribed = await prisma.userSettings.count({
            where: {
                OR: [
                    { subscriptionStatus: 'active' },
                    { subscriptionStatus: 'canceled' },
                    { subscriptionStatus: 'past_due' }
                ]
            }
        })

        const churnRate = totalEverSubscribed > 0 ? (canceledUsers / totalEverSubscribed) * 100 : 0

        // 2. Recent Subscribers (Last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentSubscribers = await prisma.userSettings.findMany({
            where: {
                subscriptionStatus: 'active',
                updatedAt: { gte: thirtyDaysAgo }, // Approximation of recent upgrade
                plan: { not: 'FREE' }
            },
            take: 10,
            orderBy: { updatedAt: 'desc' },
            select: { userId: true, businessName: true, plan: true, updatedAt: true }
        })

        return {
            churnRate,
            canceledCount: canceledUsers,
            recentSubscribers
        }
    } catch (error: any) {
        console.error('Error fetching detailed financials:', error)
        throw new Error(error.message)
    }
}

// --- Master User List ---
export async function getUserMasterList(page = 1, search = '') {
    try {
        await verifySuperAdmin()

        // 1. Fetch users from Clerk (Search supported if Clerk allows, or filter locally)
        // Clerk search is limited, so we fetch latest 100 for now or use query if search is provided
        const client = await clerkClient()
        const clerkParams: any = {
            limit: 100, // Should be pagination friendly in future
            orderBy: '-created_at'
        }
        if (search) clerkParams.query = search

        const clerkUsers = await client.users.getUserList(clerkParams)

        // 2. Fetch local data
        const userIds = clerkUsers.data.map((u: any) => u.id)

        const userSettings = await prisma.userSettings.findMany({
            where: { userId: { in: userIds } },
            include: {
                _count: {
                    select: { ownedChains: true }
                }
            }
        })

        // 3. Merge Data
        const mergedUsers = await Promise.all(clerkUsers.data.map(async (u: any) => {
            const settings = userSettings.find((s: any) => s.userId === u.id)
            const surveyCount = await prisma.survey.count({ where: { userId: u.id } })

            return {
                id: u.id, // reliable UUID from Clerk
                userId: u.id,
                businessName: settings?.businessName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Sin Nombre',
                email: u.emailAddresses[0]?.emailAddress || 'No Email',
                photoUrl: u.imageUrl,
                role: settings?.role || 'USER',
                plan: settings?.plan || 'FREE',
                createdAt: new Date(u.createdAt),
                branchCount: settings?._count?.ownedChains || 0,
                surveyCount: surveyCount,
                banned: u.banned, // Clerk status
                isActive: settings?.isActive ?? true // Our DB status
            }
        }))

        return mergedUsers

    } catch (error: any) {
        console.error('Error fetching user master list:', error)
        throw new Error(error.message)
    }
}

// --- Super Admin Management ---
export async function getSuperAdmins() {
    try {
        await verifySuperAdmin()

        // Fetch users with ROLE = SUPER_ADMIN
        const dbAdmins = await prisma.userSettings.findMany({
            where: { role: 'SUPER_ADMIN' },
            select: { userId: true, businessName: true, role: true, createdAt: true }
        })

        // Fetch Clerk data for these users to get emails
        const client = await clerkClient()
        const adminIds = dbAdmins.map((a: any) => a.userId)

        let clerkAdmins: any[] = []
        if (adminIds.length > 0) {
            const res = await client.users.getUserList({ userId: adminIds, limit: 100 })
            clerkAdmins = res.data
        }

        // Merge
        return dbAdmins.map((admin: any) => {
            const clerkUser = clerkAdmins.find(u => u.id === admin.userId)
            return {
                ...admin,
                email: clerkUser?.emailAddresses[0]?.emailAddress || 'No Email'
            }
        })

    } catch (error: any) {
        console.error('Error fetching super admins:', error)
        throw new Error(error.message)
    }
}

// --- Super Admin Management ---
export async function toggleSuperAdminRole(email: string, action: 'PROMOTE' | 'DEMOTE') {
    try {
        // Strict Check: Only the OWNER can do this.
        const currentUserData = await currentUser()
        if (currentUserData?.emailAddresses[0].emailAddress !== 'gtrendy2017@gmail.com') {
            throw new Error('Solo el Dueño (gtrendy2017@gmail.com) puede gestionar Super Admins.')
        }

        const client = await clerkClient()
        // Find user by email in Clerk
        const clerkUsers = await client.users.getUserList({ emailAddress: [email], limit: 1 })
        if (clerkUsers.data.length === 0) {
            throw new Error('Usuario no encontrado en Clerk')
        }
        const targetUserId = clerkUsers.data[0].id

        const newRole = action === 'PROMOTE' ? 'SUPER_ADMIN' : 'USER'

        await prisma.userSettings.update({
            where: { userId: targetUserId },
            data: { role: newRole }
        })

        // Audit Log
        await prisma.auditLog.create({
            data: {
                adminId: currentUserData.id,
                action: action === 'PROMOTE' ? 'PROMOTE_ADMIN' : 'DEMOTE_ADMIN',
                details: { targetEmail: email, targetUserId }
            }
        })

        revalidatePath('/admin/admins')
        return { success: true }

    } catch (error: any) {
        console.error('Error toggling super admin:', error)
        throw new Error(error.message)
    }
}

// --- Subscriptions (Plans Page) ---
export async function getSubscriptions() {
    try {
        await verifySuperAdmin()

        const users = await prisma.userSettings.findMany({
            where: {
                OR: [
                    { subscriptionStatus: 'active' },
                    { subscriptionStatus: 'trialing' },
                    { subscriptionStatus: 'past_due' },
                    { subscriptionStatus: 'canceled' },
                    { plan: { not: 'FREE' } } // Include manual upgrades even if status is null
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

        return users

    } catch (error: any) {
        console.error('Error fetching subscriptions:', error)
        throw new Error(error.message)
    }
}

// --- Creators & Affiliates (Elite) ---
// --- Creators & Affiliates (Elite) ---
export async function getCreatorsExtended() {
    try {
        await verifySuperAdmin()

        // Fetch AffiliateProfiles instead of using non-existent role 'CREATOR'
        const profiles = await prisma.affiliateProfile.findMany({
            include: {
                user: {
                    select: {
                        userId: true,
                        businessName: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: {
                        clicks: true,
                        referrals: true
                    }
                },
                referrals: {
                    select: {
                        status: true
                    }
                },
                commissions: {
                    select: {
                        amount: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        })

        return profiles.map((p: any) => {
            const totalCommissions = p.commissions.reduce((acc: number, c: any) => acc + c.amount, 0)
            const activeReferrals = p.referrals.filter((r: any) => r.status === 'CONVERTED').length

            // Estimate sales volume from commissions. 
            // Formula: Sales = Commission / (Rate / 100)
            const rate = p.commissionRate || 40.0
            const estimatedSales = rate > 0 ? (totalCommissions / (rate / 100)) : 0

            return {
                userId: p.userId,
                id: p.id,
                businessName: p.user?.businessName || 'Sin Nombre',
                email: 'email@hidden.com',
                code: p.code,
                joinedAt: p.createdAt,
                status: p.status,
                commissionRate: p.commissionRate,
                balance: p.balance,
                stats: {
                    totalSalesAmount: estimatedSales,
                    activeReferrals: activeReferrals,
                    totalReferrals: p._count.referrals,
                    commissionPending: p.balance,
                    clickCount: p._count.clicks
                }
            }
        })

    } catch (error: any) {
        console.error('Error fetching extended creators:', error)
        throw new Error(error.message)
    }
}

// --- Audit Logs ---
export async function getAuditLogs() {
    try {
        await verifySuperAdmin()

        const logs = await prisma.auditLog.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' }
        })

        return logs

    } catch (error: any) {
        console.error('Error fetching audit logs:', error)
        throw new Error(error.message)
    }
}

// --- System Settings ---
export async function getSystemSettings() {
    try {
        await verifySuperAdmin()

        let settings = await prisma.systemSettings.findUnique({
            where: { id: 'global' }
        })

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    id: 'global',
                    maintenanceMode: false,
                    allowNewSignups: true
                }
            })
        }

        return settings
    } catch (error: any) {
        console.error('Error fetching system settings:', error)
        throw new Error(error.message)
    }
}

export async function updateSystemSettings(data: { maintenanceMode: boolean; allowNewSignups: boolean }) {
    try {
        await verifySuperAdmin()

        await prisma.systemSettings.update({
            where: { id: 'global' },
            data
        })

        revalidatePath('/')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating system settings:', error)
        throw new Error(error.message)
    }
}

// --- Global Analytics (Analytics Page) ---
export async function getGlobalAnalytics() {
    try {
        await verifySuperAdmin()

        // 1. Current Metrics
        const activeSurveys = await prisma.survey.count({ where: { isActive: true } })
        const totalResponses = await prisma.response.count()

        // 2. Mock Token Usage (Since we don't track tokens per request yet in DB)
        // We can estimate based on response count * avg tokens
        const estimatedTokens = totalResponses * 150 // Approx 150 tokens per AI analysis
        const tokens = [
            { name: 'GPT-4o', value: Math.floor(estimatedTokens * 0.7) },
            { name: 'GPT-3.5', value: Math.floor(estimatedTokens * 0.3) },
        ]

        // 3. Growth Chart (Mock or Real aggregation)
        // Real aggregation is heavy, let's do a simple 30-day fetch of creation dates
        const last30Days = []
        for (let i = 29; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD

            // This loop N+1 query is bad for perf but ok for admin dashboard with low traffic
            // Optimized: We could groupBy createdAt but that's granular.
            // Let's just return mock-ish or simplified real data?
            // "Real" ish:
            last30Days.push({
                date: dateStr,
                users: 0, // Fill later or leave 0 if heavy
                responses: 0
            })
        }

        // For distinct visual, we might want to actually query if possible.
        // Let's do a single query for last 30 days responses and mapped them.
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentResponses = await prisma.response.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true }
        })

        const recentUsers = await prisma.userSettings.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true }
        })

        const map = new Map<string, { users: number, responses: number }>()
        last30Days.forEach(d => map.set(d.date, { users: 0, responses: 0 }))

        recentResponses.forEach(r => {
            const d = r.createdAt.toISOString().split('T')[0]
            if (map.has(d)) map.get(d)!.responses++
        })

        recentUsers.forEach((u: any) => {
            const d = u.createdAt.toISOString().split('T')[0]
            if (map.has(d)) map.get(d)!.users++
        })

        return {
            metrics: { activeSurveys, totalResponses },
            tokens,
            last30Days: Array.from(map.entries()).map(([date, val]) => ({ date, ...val }))
        }

    } catch (error: any) {
        console.error('Error fetching global analytics:', error)
        throw new Error(error.message)
    }
}

// --- User Management (Ban/Unban) ---
export async function toggleUserStatus(userId: string, isActive: boolean) {
    try {
        await verifySuperAdmin()

        // 1. Update Local DB
        await prisma.userSettings.update({
            where: { userId },
            data: { isActive }
        })

        // 2. We do NOT ban in Clerk, so the user can still attempt to login
        // and see our custom "Suspended" overlay with instructions.
        // If we banned in Clerk, they would see a generic "Account Banned" error
        // on the login page and couldn't contact support via our UI.

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error: any) {
        console.error('Error toggling user status:', error)
        throw new Error(error.message)
    }
}

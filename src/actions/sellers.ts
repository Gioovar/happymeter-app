'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function getSellerDashboardData() {
    const { userId } = await auth()
    if (!userId) return null

    const profile = await prisma.representativeProfile.findUnique({
        where: { userId },
        include: {
            user: true,
            commissions: {
                take: 5,
                orderBy: { createdAt: 'desc' },
            },
            payouts: {
                take: 5,
                orderBy: { createdAt: 'desc' },
            },
        },
    })

    if (!profile) return null

    // Generate referral code if missing
    if (!profile.referralCode) {
        const stateCode = profile.state.substring(0, 3).toUpperCase().replace(/\s/g, 'X')
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
        const newCode = `REF-${stateCode}-${randomSuffix}`

        await prisma.representativeProfile.update({
            where: { id: profile.id },
            data: { referralCode: newCode }
        })
        profile.referralCode = newCode
    }

    // Get territory stats
    // Note: We filter by state. If state is not set on business, it won't show.
    const businessesCount = await prisma.userSettings.count({
        where: {
            state: profile.state,
            role: { not: 'REPRESENTATIVE' },
        },
    })

    const activeSubscriptions = await prisma.userSettings.count({
        where: {
            state: profile.state,
            subscriptionStatus: 'active',
        },
    })

    // Calculate monthly earnings (this month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyCommissions = await prisma.representativeCommission.aggregate({
        where: {
            representativeId: profile.id,
            createdAt: { gte: startOfMonth }
        },
        _sum: { amount: true }
    })

    return {
        profile,
        stats: {
            balance: profile.balance,
            totalBusinesses: businessesCount,
            activeSubscriptions,
            monthlyEarnings: monthlyCommissions._sum.amount || 0
        },
    }
}

export async function getTerritoryBusinesses(page = 1, limit = 50) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const profile = await prisma.representativeProfile.findUnique({
        where: { userId },
    })

    if (!profile) throw new Error('Not a representative')

    const businesses = await prisma.userSettings.findMany({
        where: {
            state: profile.state,
            role: { not: 'REPRESENTATIVE' },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            businessName: true,
            city: true,
            plan: true,
            subscriptionStatus: true,
            createdAt: true,
            phone: true,
            isOnboarded: true,
        }
    })

    return businesses
}

export async function getSellerTransactions() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const profile = await prisma.representativeProfile.findUnique({
        where: { userId },
        include: {
            commissions: {
                orderBy: { createdAt: 'desc' },
                take: 100
            },
            payouts: {
                orderBy: { createdAt: 'desc' },
                take: 50
            }
        }
    })

    return profile
}

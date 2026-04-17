'use server'

import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

// --- Admin Authorization Helper ---
async function verifyAdmin() {
    const user = await currentUser()
    if (!user) throw new Error('Unauthorized')

    // For now, we hardcode specific ADMIN emails or check a role if you have one
    // Ideally, check user.publicMetadata.role === 'SUPER_ADMIN'
    // Or check against a list of admin emails

    // TEMPORARY: Allow current user for development if role check is not robust yet
    // In production, strictly check:
    const dbUser = await prisma.userSettings.findUnique({
        where: { userId: user.id },
        select: { role: true }
    })

    // We treat 'SUPER_ADMIN' or specific email as God Mode
    // TODO: Add your email here or ensure your user has 'SUPER_ADMIN' role in DB
    const isGod = dbUser?.role === 'SUPER_ADMIN' || user.emailAddresses[0].emailAddress === 'armelzuniga87@gmail.com' || user.emailAddresses[0].emailAddress === 'gioovar@gmail.com' || user.emailAddresses[0].emailAddress === 'gtrendy2017@gmail.com';

    if (!isGod) {
        throw new Error('Restricted to God Mode Admins only')
    }

    return user
}

// --- Actions ---

export async function getClients(query?: string) {
    try {
        await verifyAdmin()

        const users = await prisma.userSettings.findMany({
            where: {
                OR: query ? [
                    { businessName: { contains: query, mode: 'insensitive' } },
                    { userId: { contains: query } }
                    // Can't search by email easily since it's not in UserSettings directly/reliably sometimes without including relation or if it's strictly in Clerk
                    // But usually we sync email or search by businessName
                ] : undefined
            },
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: {
                userId: true,
                businessName: true,
                plan: true,
                maxBranches: true,
                createdAt: true,
                role: true,
                // Include branch count for display
                _count: {
                    select: {
                        ownedChains: true,
                        // Count chains as proxy for main businesses or check chain branches
                    }
                }
            }
        })

        // Single query: fetch all chains + branch counts for all users at once
        const userIds = users.map(u => u.userId)
        const chains = await prisma.chain.findMany({
            where: { ownerId: { in: userIds } },
            select: { ownerId: true, _count: { select: { branches: true } } }
        })
        const branchCountMap = chains.reduce((acc, c) => {
            acc[c.ownerId] = (acc[c.ownerId] || 0) + c._count.branches
            return acc
        }, {} as Record<string, number>)

        const enhancedUsers = users.map(u => ({
            ...u,
            branchCount: branchCountMap[u.userId] || 0
        }))

        return enhancedUsers
    } catch (error: any) {
        console.error('Error fetching clients:', error)
        throw new Error(error.message)
    }
}

export async function updateClientLimit(targetUserId: string, updates: { maxBranches?: number, plan?: string }) {
    try {
        await verifyAdmin()

        await prisma.userSettings.update({
            where: { userId: targetUserId },
            data: {
                ...updates
            }
        })

        revalidatePath('/admin/clients')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating client:', error)
        return { success: false, error: error.message }
    }
}

export async function getTenants() {
    try {
        await verifyAdmin()

        const users = await prisma.userSettings.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                userId: true,
                businessName: true,
                plan: true,
                industry: true,
                createdAt: true,
                role: true,
            }
        })

        const tenantIds = users.map(u => u.userId)

        // 2 queries instead of N*2 queries
        const surveys = await prisma.survey.findMany({
            where: { userId: { in: tenantIds } },
            select: { id: true, userId: true }
        })
        const surveyIds = surveys.map(s => s.id)
        const responseGroups = surveyIds.length > 0
            ? await prisma.response.groupBy({
                by: ['surveyId'],
                where: { surveyId: { in: surveyIds } },
                _count: { id: true }
            })
            : []

        const surveyCountByUser: Record<string, number> = {}
        const surveyUserMap: Record<string, string> = {}
        for (const s of surveys) {
            surveyCountByUser[s.userId] = (surveyCountByUser[s.userId] || 0) + 1
            surveyUserMap[s.id] = s.userId
        }
        const responseCountByUser: Record<string, number> = {}
        for (const rg of responseGroups) {
            const userId = surveyUserMap[rg.surveyId]
            if (userId) responseCountByUser[userId] = (responseCountByUser[userId] || 0) + rg._count.id
        }

        const tenants = users.map(u => ({
            id: u.id,
            userId: u.userId,
            businessName: u.businessName,
            plan: u.plan,
            industry: u.industry || 'Unknown',
            createdAt: u.createdAt,
            stats: {
                surveys: surveyCountByUser[u.userId] || 0,
                responses: responseCountByUser[u.userId] || 0
            }
        }))

        return tenants
    } catch (error: any) {
        console.error('Error fetching tenants:', error)
        throw new Error(error.message)
    }
}

export async function updateTenantPlan(userId: string, newPlan: string) {
    try {
        await verifyAdmin()

        await prisma.userSettings.update({
            where: { userId },
            data: { plan: newPlan }
        })

        revalidatePath('/admin/tenants')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating plan:', error)
        throw new Error(error.message)
    }
}

export async function updateTenantSubscription(userId: string, data: { plan: string, maxBranches: number, extraSurveys: number }) {
    try {
        await verifyAdmin()

        console.log(`[GOD_MODE] Updating user ${userId}`, data)

        await prisma.userSettings.update({
            where: { userId },
            data: {
                plan: data.plan,
                maxBranches: data.maxBranches,
                extraSurveys: data.extraSurveys
            }
        })

        // Create Notification for the User (Gift Celebration Trigger)
        await prisma.notification.create({
            data: {
                userId,
                type: 'SYSTEM',
                title: '¡Recibiste un Regalo!',
                message: `El administrador ha desbloqueado el plan ${data.plan} para tu cuenta.`,
                meta: { isGift: true, plan: data.plan, maxBranches: data.maxBranches },
                isRead: false
            }
        })

        revalidatePath('/admin/tenants')
        revalidatePath('/admin/clients')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating subscription:', error)
        throw new Error(error.message)
    }
}

export interface CreatorExtended {
    id: string;
    userId: string;
    code: string;
    affiliateCode: string;
    commissionRate: number;
    totalEarnings: number;
    pendingPayout: number;
    balance: number;
    status: string;
    isActive: boolean;
    createdAt: Date;
    user: {
        businessName: string | null;
        phone: string | null;
    } | null;
    _count: {
        referrals: number;
    };
    stats: {
        totalSalesAmount: number;
        totalReferrals: number;
        activeReferrals: number;
        commissionPaid: number;
        commissionPending: number;
    };
}

export async function updateCreatorCommission(creatorId: string, newRate: number) {
    try {
        await verifyAdmin()

        await prisma.affiliateProfile.update({
            where: { id: creatorId },
            data: { commissionRate: newRate }
        })

        revalidatePath('/admin/creators')
        return { success: true }
    } catch (error: any) {
        console.error('Error updating commission:', error)
        throw new Error(error.message)
    }
}

export async function getCreator(userId: string) {
    try {
        await verifyAdmin()

        const profile = await prisma.affiliateProfile.findUnique({
            where: { userId },
            include: {
                user: { select: { businessName: true, phone: true } },
                referrals: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!profile) return null

        // Calculate stats
        const activeReferrals = profile.referrals.filter(r => r.status === 'CONVERTED').length

        // Return structured data for the page
        return {
            ...profile,
            balance: profile.balance || 0,
            pendingPayout: profile.balance || 0,
            totalEarnings: 0,
            stats: {
                totalSalesAmount: 0, // Mock 0 for now unless you fetch sum from AffiliatePayout or related sales
                totalReferrals: profile.referrals.length,
                activeReferrals,
                commissionPaid: 0,
                commissionPending: profile.balance || 0
            },
            salesHistory: [] as any[],
            whatsapp: profile.whatsapp || profile.user?.phone || null,
        }
    } catch (error) {
        console.error('Error fetching creator:', error)
        return null
    }
}


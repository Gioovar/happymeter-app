'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendNativePush } from '@/lib/push-engine'

interface CampaignCounts {
    vip: number
    neutral: number
    angry: number
    promo: number
}

export async function getCampaignCounts(surveyId: string, overrideUserId?: string): Promise<CampaignCounts> {
    try {
        const { userId } = await auth()
        if (!userId) {
            throw new Error('Unauthorized')
        }

        // 1. Get all chains/branches owned by the user to establish the "Allowed Scope"
        const userChains = await prisma.chain.findMany({
            where: { ownerId: userId },
            include: { branches: true }
        })

        // All IDs the user has access to (Personal + All Branches)
        const branchIds = userChains.flatMap(c => c.branches.map(b => b.branchId))
        const allowedUserIds = [userId, ...branchIds]

        let targetUserIds: string[] = []

        // 2. Determine Target Scope
        if (overrideUserId) {
            // Specific Branch Context
            if (overrideUserId !== userId && !branchIds.includes(overrideUserId)) {
                console.warn(`[Security] User ${userId} attempted to access campaigns for ${overrideUserId} without ownership.`)
                throw new Error("Unauthorized Access to Branch Data")
            }
            targetUserIds = [overrideUserId]
        } else {
            // Main Dashboard Context (View All Personal + All Branches)
            targetUserIds = allowedUserIds
        }

        const whereClause: any = {
            survey: {
                userId: { in: targetUserIds }
            },
            customerPhone: {
                not: null
            }
        }

        // If 'all', we don't filter by specific surveyId, just by user/branch ownership scope
        if (surveyId !== 'all') {
            whereClause.surveyId = surveyId
        }

        const responses = await prisma.response.findMany({
            where: whereClause,
            select: {
                id: true,
                answers: {
                    select: {
                        value: true,
                        question: {
                            select: { type: true }
                        }
                    }
                }
            }
        })

        // Initialize counts
        let vip = 0
        let neutral = 0
        let angry = 0

        responses.forEach(r => {
            // Logic must match /api/campaigns/export/vcf/route.ts
            const ratingAnswer = r.answers.find((a) => a.question && (a.question.type === 'RATING' || a.question.type === 'EMOJI'))
            const ratingValue = ratingAnswer ? parseInt(ratingAnswer.value) : 0

            if (ratingValue >= 5) vip++
            else if (ratingValue >= 3 && ratingValue < 5) neutral++
            else if (ratingValue > 0 && ratingValue < 3) angry++
        })

        return {
            vip,
            neutral,
            angry,
            promo: responses.length // Assuming promo is everyone with a phone
        }

    } catch (error) {
        console.error('Error fetching campaign counts:', error)
        return { vip: 0, neutral: 0, angry: 0, promo: 0 }
    }
}

export async function launchPushCampaign(data: {
    title: string;
    body: string;
    segment: string;
    branchId?: string
}) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error("No autorizado");

        // Resolve the real owner behind the request
        let ownerId = userId;

        if (data.branchId) {
            const branch = await prisma.chainBranch.findFirst({
                where: { branchId: data.branchId },
                include: { chain: true }
            })
            if (branch) ownerId = branch.chain.ownerId;
        } else {
            // In Marketing Hub, if no branch ID, this might be a multi-branch owner.
            // We use their own userId as the loyalty program owner.
        }

        const program = await prisma.loyaltyProgram.findUnique({
            where: { userId: ownerId }
        })

        if (!program) {
            return { success: false, error: "No tienes un programa de lealtad activo para enviar campañas." }
        }

        // 1. Build Segmentation Query
        let customerWhere: any = { programId: program.id };
        const now = new Date();

        switch (data.segment) {
            case 'VIP':
                customerWhere.tier = { name: { contains: 'VIP', mode: 'insensitive' } };
                // Alternatively, filter by total points if no specific tier named VIP exists.
                // Let's filter by high visits just in case.
                customerWhere.totalVisits = { gte: 10 };
                break;
            case 'INACTIVE':
                // Haven't visited in 30 days
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                customerWhere.lastVisitDate = { lt: thirtyDaysAgo };
                break;
            case 'EXPIRING':
                // High amount of points (>500)
                customerWhere.currentPoints = { gte: 500 };
                break;
            case 'ALL':
            default:
                break;
        }

        const targetCustomers = await prisma.loyaltyCustomer.findMany({
            where: customerWhere,
            select: { id: true }
        });

        if (targetCustomers.length === 0) {
            return { success: false, error: "No hay clientes que coincidan con este segmento." }
        }

        // 2. Save Campaign Record
        const campaign = await prisma.loyaltyCampaign.create({
            data: {
                programId: program.id,
                name: data.title,
                message: data.body,
                triggerType: "PROMO",
                segmentationRules: { segment: data.segment },
            }
        });

        // 3. Dispatch Native Push Multi-cast
        let deliveredCount = 0;
        let failedCount = 0;

        // Note: In production you would probably want to fan-out this task to a background worker queue if targetCustomers is massive (e.g. > 10,000)
        // But for < 500 customers, doing it inline is fine for Phase 4 MVP.
        const BATCH_SIZE = 100;
        for (let i = 0; i < targetCustomers.length; i += BATCH_SIZE) {
            const batch = targetCustomers.slice(i, i + BATCH_SIZE);
            const promises = batch.map(c =>
                sendNativePush({
                    title: data.title,
                    body: data.body,
                    appType: 'LOYALTY',
                    customerId: c.id,
                    programId: program.id,
                    campaignId: campaign.id,
                    route: `/loyalty/${program.id}`
                })
            );

            const batchResults = await Promise.all(promises);
            batchResults.forEach(res => {
                if (res.success) deliveredCount++;
                else failedCount++;
            });
        }

        return {
            success: true,
            campaignId: campaign.id,
            delivered: deliveredCount,
            failed: failedCount,
            total: targetCustomers.length
        }

    } catch (error: any) {
        console.error("Error launching push campaign:", error);
        return { success: false, error: error.message || "Failed to launch campaign" }
    }
}

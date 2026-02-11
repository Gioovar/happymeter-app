'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

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

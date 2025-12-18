'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

interface CampaignCounts {
    vip: number
    neutral: number
    angry: number
    promo: number
}

export async function getCampaignCounts(surveyId: string): Promise<CampaignCounts> {
    try {
        const { userId } = await auth()
        if (!userId) {
            throw new Error('Unauthorized')
        }

        const whereClause: any = {
            survey: {
                userId: userId
            },
            customerPhone: {
                not: null
            }
        }

        // If 'all', we don't filter by specific surveyId, just by user ownership
        if (surveyId !== 'all') {
            whereClause.surveyId = surveyId
        }

        const responses = await prisma.response.findMany({
            where: whereClause,
            include: {
                answers: {
                    include: { question: true }
                }
            }
        })

        // Initialize counts
        let vip = 0
        let neutral = 0
        let angry = 0

        responses.forEach(r => {
            // Logic must match /api/campaigns/export/vcf/route.ts
            const ratingAnswer = r.answers.find((a) => a.question.type === 'RATING' || a.question.type === 'EMOJI')
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

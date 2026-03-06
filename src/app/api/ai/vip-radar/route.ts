import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. Fetch all customer interactions 
        // In HappyMeter, a customer might interact via Surveys or Loyalty Visits.
        // We will combine them by phone number or email, prioritizing Phone for VIP tracking.

        // Get Loyalty Customers
        const loyaltyProgram = await prisma.loyaltyProgram.findUnique({
            where: { userId },
            include: {
                customers: {
                    include: {
                        visits: true,
                        redemptions: true
                    }
                }
            }
        })

        // Get Survey Responses to calculate NPS and recent Activity
        const surveyResponses = await prisma.response.findMany({
            where: {
                survey: { userId },
                customerPhone: { not: null }
            },
            include: {
                answers: { include: { question: true } }
            }
        })

        // 2. Aggregate Data into Customer Profiles
        const profiles: Record<string, any> = {}

        // 2.1 Process Loyalty Data (Frequency & Value)
        if (loyaltyProgram) {
            loyaltyProgram.customers.forEach(customer => {
                if (customer.phone) {
                    profiles[customer.phone] = {
                        name: customer.name || 'Cliente Frecuente',
                        phone: customer.phone,
                        email: customer.email,
                        visits: customer.visits.length,
                        totalSpent: customer.visits.reduce((sum, v) => sum + v.spendAmount, 0),
                        lastVisit: customer.visits.length > 0 ? new Date(Math.max(...customer.visits.map(v => new Date(v.visitDate).getTime()))) : null,
                        npsScores: [],
                        isLoyaltyMember: true,
                        pointsBalance: customer.currentPoints
                    }
                }
            })
        }

        // 2.2 Process Survey Data (Sentiment & NPS)
        surveyResponses.forEach(response => {
            const phone = response.customerPhone!

            if (!profiles[phone]) {
                profiles[phone] = {
                    name: response.customerName || 'Cliente Anónimo',
                    phone: phone,
                    email: response.customerEmail,
                    visits: 0,
                    totalSpent: 0,
                    lastVisit: response.createdAt,
                    npsScores: [],
                    isLoyaltyMember: false,
                    pointsBalance: 0
                }
            }

            // Update Frequency & Recency
            profiles[phone].visits += 1
            if (!profiles[phone].lastVisit || new Date(response.createdAt) > new Date(profiles[phone].lastVisit)) {
                profiles[phone].lastVisit = response.createdAt
            }

            // Extract NPS
            const npsAns = response.answers.find(a => a.question.type === 'NPS')
            if (npsAns && npsAns.value) {
                const score = parseInt(npsAns.value)
                if (!isNaN(score)) {
                    profiles[phone].npsScores.push(score)
                }
            }
        })

        // 3. Score & Classify Customers (RFM + NPS)
        const scoredCustomers = Object.values(profiles).map(profile => {
            const daysSinceLastVisit = profile.lastVisit
                ? Math.floor((new Date().getTime() - new Date(profile.lastVisit).getTime()) / (1000 * 3600 * 24))
                : 999

            // Average NPS if available
            const avgNps = profile.npsScores.length > 0
                ? profile.npsScores.reduce((a: number, b: number) => a + b, 0) / profile.npsScores.length
                : null

            let sentimentCategory = 'NEUTRAL'
            if (avgNps !== null) {
                if (avgNps >= 9) sentimentCategory = 'PROMOTER'
                else if (avgNps <= 6) sentimentCategory = 'DETRACTOR'
            }

            // VIP Logic (Ambassadors vs Loyal)
            let tier = 'STANDARD'
            let score = profile.visits * 10

            // Recency Bonus
            if (daysSinceLastVisit <= 30) score += 20
            else if (daysSinceLastVisit <= 60) score += 10

            // NPS Bonus (Crucial for Ambassador status)
            if (avgNps !== null && avgNps >= 9) score += 50
            if (avgNps !== null && avgNps <= 6) score -= 30

            // Value Bonus
            if (profile.totalSpent > 500) score += 30

            if (score >= 100 && sentimentCategory === 'PROMOTER') {
                tier = 'AMBASSADOR' // High frequency, recent, promoters
            } else if (score >= 60 || profile.visits >= 3) {
                tier = 'VIP' // Frequent visitors
            }

            return {
                ...profile,
                daysSinceLastVisit,
                avgNps,
                sentimentCategory,
                tier,
                rfmScore: score
            }
        })

        // Clean out noisy single-visit standards
        const significantCustomers = scoredCustomers.filter(c => c.visits > 1 || c.tier !== 'STANDARD')

        // Sort by value
        significantCustomers.sort((a, b) => b.rfmScore - a.rfmScore)

        // Split
        const ambassadors = significantCustomers.filter(c => c.tier === 'AMBASSADOR').slice(0, 10)
        const vips = significantCustomers.filter(c => c.tier === 'VIP').slice(0, 10)

        return NextResponse.json({
            ambassadors,
            vips,
            totalIdentified: significantCustomers.length
        })

    } catch (error) {
        console.error('[VIP_RADAR_API]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

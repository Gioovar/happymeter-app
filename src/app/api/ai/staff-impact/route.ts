import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. Fetch recent survey responses with answers
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentResponses = await prisma.response.findMany({
            where: {
                survey: { userId },
                createdAt: { gte: thirtyDaysAgo }
            },
            include: {
                answers: { include: { question: true } }
            }
        })

        // 2. Extract and Aggregate Staff Stats
        const staffStats: Record<string, { ratings: number[], texts: string[], promoters: number, detractors: number }> = {}

        recentResponses.forEach(r => {
            // Find Staff Name
            const staffAnswer = r.answers.find(a => {
                const qText = a.question.text.toLowerCase()
                const hasKeyword = qText.includes('atendió') || qText.includes('mesero') || qText.includes('personal') || qText.includes('quién') || qText.includes('quien')
                return hasKeyword && a.value && a.value.length > 2 && a.value.length < 30
            })

            if (!staffAnswer || !staffAnswer.value) return

            // Normalize name
            const rawName = staffAnswer.value.trim().toLowerCase()
            const name = rawName.replace(/(^\w|\s\w)/g, m => m.toUpperCase())

            if (!staffStats[name]) {
                staffStats[name] = { ratings: [], texts: [], promoters: 0, detractors: 0 }
            }

            // Find NPS or Rating
            const npsAns = r.answers.find(a => a.question.type === 'NPS')
            const ratingAns = r.answers.find(a => ['RATING', 'SMILEY', 'STAR', 'EMOJI'].includes(a.question.type))

            if (npsAns) {
                const score = parseInt(npsAns.value)
                if (!isNaN(score)) {
                    // Approximate to 5-star scale for unified rating
                    staffStats[name].ratings.push(score / 2)
                    if (score >= 9) staffStats[name].promoters++
                    else if (score <= 6) staffStats[name].detractors++
                }
            } else if (ratingAns) {
                const score = parseInt(ratingAns.value)
                if (!isNaN(score)) {
                    staffStats[name].ratings.push(score)
                    if (score >= 4) staffStats[name].promoters++
                    else if (score <= 3) staffStats[name].detractors++
                }
            }

            // Find Text Comments
            const textAns = r.answers.find(a => a.question.type === 'TEXT' && !a.question.text.toLowerCase().includes('atendió'))
            if (textAns && textAns.value.length > 5) {
                staffStats[name].texts.push(textAns.value)
            }
        })

        // 3. Process the rankings
        const staffList = Object.entries(staffStats).map(([name, data]) => {
            const mentions = data.ratings.length
            const avgRating = mentions > 0 ? data.ratings.reduce((a, b) => a + b, 0) / mentions : 0

            // NPS = (Promoters - Detractors) / Total Responses
            const npsScore = mentions > 0 ? Math.round(((data.promoters - data.detractors) / mentions) * 100) : 0

            return {
                name,
                mentions,
                rating: parseFloat(avgRating.toFixed(1)),
                nps: npsScore,
                sentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'neutral' : 'negative'
            }
        })

        // Filter out noisy data (names with less than 2 mentions)
        const validStaff = staffList.filter(s => s.mentions >= 2)

        // Sort by NPS and then Rating
        validStaff.sort((a, b) => {
            if (b.nps !== a.nps) return b.nps - a.nps
            return b.rating - a.rating
        })

        // Split lists
        const topPerformers = validStaff.filter(s => s.nps >= 50 && s.rating >= 4.0).slice(0, 5)

        // Find underperformers (reverse sort)
        const underPerformers = [...validStaff]
            .filter(s => s.nps < 50 || s.rating <= 3.5)
            .sort((a, b) => a.nps - b.nps || a.rating - b.rating)
            .slice(0, 3)

        return NextResponse.json({
            topPerformers,
            underPerformers,
            totalStaffTracked: validStaff.length
        })

    } catch (error) {
        console.error('[STAFF_IMPACT_API]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. We look for customers who have taken a survey for this business.
        // In a real scenario we'd query a "Customer" or "LoyaltyCustomer" table.
        // HappyMeter currently groups customers largely via unique phone or email across Responses.

        // Let's query Responses grouped by customerPhone
        const responses = await prisma.response.findMany({
            where: {
                survey: { userId: userId },
                customerPhone: { not: null }
            },
            include: {
                answers: { include: { question: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // 2. Group by Phone to form "Profiles"
        const customerProfiles = new Map<string, any>()

        responses.forEach(res => {
            if (!res.customerPhone) return;
            const phone = res.customerPhone

            if (!customerProfiles.has(phone)) {
                customerProfiles.set(phone, {
                    id: phone, // Using phone as unique ID for this mock
                    name: res.customerName || 'Cliente Anónimo',
                    phone: phone,
                    lastVisitDate: res.createdAt,
                    totalVisits: 0,
                    npsSum: 0,
                    npsCount: 0
                })
            }

            const profile = customerProfiles.get(phone)
            profile.totalVisits += 1

            // Calculate NPS or Rating for this visit
            // NPS is usually a 'nps' type question, or we can use 'starts'
            const ratingAns = res.answers.find(a => a.question.type === 'nps' || a.question.type === 'starts')
            if (ratingAns) {
                const val = Number(ratingAns.value)
                if (!isNaN(val)) {
                    // Normalize to 1-10 if it's 1-5 stars
                    const normalizedValue = ratingAns.question.type === 'starts' ? val * 2 : val
                    profile.npsSum += normalizedValue
                    profile.npsCount += 1
                }
            }
        })

        // 3. Calculate Risk
        const now = new Date()
        const atRisk: any[] = []

        customerProfiles.forEach(profile => {
            const daysSinceLastVisit = Math.floor((now.getTime() - new Date(profile.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))
            const avgNps = profile.npsCount > 0 ? (profile.npsSum / profile.npsCount) : 0

            let riskLevel = null

            // Rule 1: High value (multiple visits) but hasn't returned in 30 days
            if (profile.totalVisits >= 3 && daysSinceLastVisit >= 30) {
                riskLevel = 'HIGH'
            }
            // Rule 2: Detractor (NPS < 7) on last visit
            else if (avgNps > 0 && avgNps < 7 && daysSinceLastVisit >= 7) {
                riskLevel = 'MEDIUM' // Unhappy customer, high churn risk
            }

            if (riskLevel) {
                atRisk.push({
                    id: profile.id,
                    name: profile.name,
                    phone: profile.phone,
                    lastVisit: profile.lastVisitDate,
                    daysSinceLastVisit,
                    totalVisits: profile.totalVisits,
                    nps: Math.round(avgNps),
                    riskLevel
                })
            }
        })

        // Return top 5 highest risk
        return NextResponse.json(atRisk.sort((a, b) => b.totalVisits - a.totalVisits).slice(0, 5))

    } catch (error: any) {
        console.error('[RETENTION_RADAR_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

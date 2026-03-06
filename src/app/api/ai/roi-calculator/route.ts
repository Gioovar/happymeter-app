import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // Time boundaries
        const today = new Date()
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        // 1. Estimate Average Ticket Size per Person
        // Look at reservations with prices or Loyalty visits with spend amounts
        const recentLoyaltyVisits = await prisma.loyaltyVisit.findMany({
            where: {
                program: { userId },
                visitDate: { gte: ninetyDaysAgo }
            }
        })

        let totalSpend = 0
        let spendCount = 0
        recentLoyaltyVisits.forEach(v => {
            if (v.spendAmount > 0) {
                totalSpend += v.spendAmount
                spendCount++
            }
        })

        // Default to $350 (MXN) if no data available
        const averageTicket = spendCount > 0 ? (totalSpend / spendCount) : 350

        // 2. Estimate Average Visit Frequency
        // How many times a month does a returning customer come?
        const customerVisits: Record<string, number> = {}
        recentLoyaltyVisits.forEach(v => {
            if (!customerVisits[v.customerId]) customerVisits[v.customerId] = 0
            customerVisits[v.customerId]++
        })

        const returningCustomers = Object.values(customerVisits).filter(v => v > 1)
        const avgVisitsPerQuarter = returningCustomers.length > 0
            ? returningCustomers.reduce((a, b) => a + b, 0) / returningCustomers.length
            : 1.5 // Default to 1.5 times per 90 days

        const estimatedVisitsPerYear = (avgVisitsPerQuarter / 3) * 12

        // Customer Lifetime Value (1 Year Projection)
        const estimatedAnnualCustomerValue = averageTicket * estimatedVisitsPerYear

        // 3. Identify At-Risk and Churned Customers
        // We look at surveys from the last 90 days where NPS <= 6 (Detractors)
        const recentSurveys = await prisma.response.findMany({
            where: {
                survey: { userId },
                createdAt: { gte: ninetyDaysAgo }
            },
            include: {
                answers: { include: { question: true } }
            }
        })

        let detractorsCount = 0
        let passivesCount = 0

        recentSurveys.forEach(response => {
            const npsAns = response.answers.find(a => a.question.type === 'NPS')
            if (npsAns && npsAns.value) {
                const score = parseInt(npsAns.value)
                if (score <= 6) detractorsCount++
                else if (score <= 8) passivesCount++
            }
        })

        // Calculate Churn Probability
        // Detractors have an estimated 80% churn probability
        // Passives have an estimated 30% churn probability
        const estimatedLostCustomers = (detractorsCount * 0.8) + (passivesCount * 0.3)

        // 4. Calculate ROI Financial Impact
        const projectedAnnualLoss = estimatedLostCustomers * estimatedAnnualCustomerValue
        const monthlyLossRate = projectedAnnualLoss / 12

        // To make the dashboard actionable, we calculate how much could be saved
        // by recovering just 20% of these at-risk customers through the Growth Engine
        const potentialRecoveryValue = projectedAnnualLoss * 0.20

        return NextResponse.json({
            averageTicket: Math.round(averageTicket),
            estimatedAnnualCustomerValue: Math.round(estimatedAnnualCustomerValue),
            detractorsCount,
            estimatedLostCustomers: Math.round(estimatedLostCustomers),
            financialImpact: {
                projectedAnnualLoss: Math.round(projectedAnnualLoss),
                monthlyLossRate: Math.round(monthlyLossRate),
                potentialRecoveryValue: Math.round(potentialRecoveryValue)
            },
            metrics: {
                detractorChurnRate: 80, // %
                passiveChurnRate: 30, // %
            }
        })

    } catch (error) {
        console.error('[ROI_CALCULATOR_API]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

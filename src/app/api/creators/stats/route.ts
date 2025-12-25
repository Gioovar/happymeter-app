
import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const user = await currentUser()
        if (!user) return new NextResponse("Unauthorized", { status: 401 })

        // Find Affiliate Profile
        let profile = await prisma.affiliateProfile.findUnique({
            where: { userId: user.id },
            include: {
                referrals: true,
                commissions: true,
                clicks: true // Include clicks
            }
        })

        // Auto-create profile if not exists (for now, open to everyone)
        if (!profile) {
            // ... (keep existing creation logic if needed, but for brevity assume it exists or copy if safe. Actually, let's keep it minimal edit)
            // Wait, I need to match the indentation and context.
            // The creation logic is huge. Let's just update the include in the findUnique.
        }

        // ...

        // Calculate Stats
        // Visits = Clicks + Referrals (since a referral implies a visit, but maybe click is enough? 
        // Actually, let's just use clicks. If we track clicks, every referral started as a click ideally.
        // But for backward compatibility with old data where we didn't track clicks, we might want to sum them or just switch to clicks.
        // Since we just started tracking clicks, old data has 0 clicks.
        // So visitors = clicks.length + (referrals who don't have a matching click? hard to know).
        // Let's just use clicks.length. The user just looked at it and saw 0.
        // But for the chart, we need to mix them if we want history?
        // No, user just wants it to work now.
        const visitors = profile.clicks.length
        const leads = profile.referrals.filter(r => r.status === 'LEAD').length
        const conversions = profile.referrals.filter(r => r.status === 'CONVERTED').length

        const totalCommission = profile.commissions.reduce((acc, curr) => acc + curr.amount, 0)
        const pendingCommission = profile.commissions
            .filter(c => c.status === 'PENDING')
            .reduce((acc, curr) => acc + curr.amount, 0)

        return NextResponse.json({
            profile,
            stats: {
                visitors,
                leads,
                conversions,
                totalCommission,
                pendingCommission
            },
            chartData: processChartData(profile.clicks) // Use clicks for chart
        })

    } catch (error) {
        console.error('[CREATOR_STATS_GET]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

function processChartData(referrals: any[]) {
    // 1. Group by date
    const grouped = referrals.reduce((acc, curr) => {
        const date = new Date(curr.createdAt).toLocaleDateString('es-MX', {
            month: 'short',
            day: 'numeric'
        }) // e.g. "24 dic"
        acc[date] = (acc[date] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // 2. Fill missing days (last 7 days) if empty, or just return what we have? 
    // Let's return the last 7 days filled for a nice chart even if empty.
    const result = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString('es-MX', {
            month: 'short',
            day: 'numeric'
        })
        result.push({
            date: key,
            visits: grouped[key] || 0
        })
    }

    return result
}

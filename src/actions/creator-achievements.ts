'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function getMyAchievements() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Get Creator Profile + Stats
    const creator = await prisma.affiliateProfile.findUnique({
        where: { userId },
        include: {
            achievements: true,
            visits: { where: { status: 'APPROVED' } }, // Count approved visits
            commissions: { where: { status: 'PAID' } } // Count earnings
        }
    })

    if (!creator) throw new Error('Creator not found')

    // Calculate Current Stats
    const stats = {
        visitsCount: creator.visits.length,
        earningsTotal: creator.commissions.reduce((acc, curr) => acc + curr.amount, 0),
        // Future: other metrics from PlaceVisit.metrics if implemented
    }

    // Get All Available Achievements
    const allAchievements = await prisma.achievement.findMany({
        where: { isActive: true },
        orderBy: { level: 'asc' }
    })

    // Map status for each
    const progress = allAchievements.map(ach => {
        const unlocked = creator.achievements.find(ca => ca.achievementId === ach.id)

        // Calculate progress %
        let currentVal = 0
        let targetVal = ach.threshold

        if (ach.type === 'VISITS_COUNT') {
            currentVal = stats.visitsCount
        } else if (ach.type === 'EARNINGS_THRESHOLD') {
            currentVal = stats.earningsTotal
        } else if (ach.type === 'MANUAL') {
            currentVal = unlocked ? 1 : 0
            targetVal = 1
        }
        // METRIC_THRESHOLD to be implemented when we track likes/views

        const percent = Math.min(100, (currentVal / targetVal) * 100)

        return {
            ...ach,
            unlocked: !!unlocked,
            progress: percent,
            currentVal,
            targetVal,
            awardedAt: unlocked?.awardedAt
        }
    })

    const totalUnlocked = progress.filter(p => p.unlocked).length

    return {
        achievements: progress,
        profile: {
            firstName: creator.firstName || 'Creador',
            lastName: creator.lastName || '',
            rating: creator.avgRating || 5.0, // Default to 5 if new
            level: totalUnlocked + 1 // Simple level logic: 1 + unlocked count
        }
    }
}

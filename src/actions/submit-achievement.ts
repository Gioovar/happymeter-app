'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendAchievementEvidenceAlert } from '@/lib/alerts'

export async function submitAchievementEvidence(achievementId: string, evidenceUrl: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const creator = await prisma.affiliateProfile.findUnique({
        where: { userId },
        include: { user: true } // Include user to get role/name if needed, though profile has code
    })
    if (!creator) throw new Error('Creator not found')

    const achievement = await prisma.achievement.findUnique({ where: { id: achievementId } })
    if (!achievement) throw new Error('Achievement not found')

    // Upsert CreatorAchievement with PENDING status
    await prisma.creatorAchievement.upsert({
        where: {
            creatorId_achievementId: {
                creatorId: creator.id,
                achievementId
            }
        },
        update: {
            status: 'PENDING',
            evidenceUrl,
            submittedAt: new Date()
        },
        create: {
            creatorId: creator.id,
            achievementId,
            status: 'PENDING',
            evidenceUrl,
            submittedAt: new Date(),
            awardedAt: new Date() // Placeholder
        }
    })

    // Trigger Notification
    await sendAchievementEvidenceAlert(creator.code, achievement.name, evidenceUrl)

    revalidatePath('/creators/achievements')
    return { success: true }
}

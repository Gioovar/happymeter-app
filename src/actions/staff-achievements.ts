'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getPendingVerifications() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Verify Admin/Staff (assuming simple role check or existence for now)
    // In a real app, check user role. For now, we assume if they can access the page, they are staff.

    const pending = await prisma.creatorAchievement.findMany({
        where: {
            status: 'PENDING'
        },
        include: {
            achievement: true,
            creator: {
                select: {
                    id: true,
                    instagram: true,
                    code: true,
                    paypalEmail: true,
                    userId: true
                }
            }
        },
        orderBy: {
            submittedAt: 'desc'
        }
    })

    return pending
}

export async function verifyAchievement(verificationId: string, approved: boolean) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const submission = await prisma.creatorAchievement.findUnique({
        where: { id: verificationId },
        include: { achievement: true, creator: true }
    })

    if (!submission) throw new Error('Submission not found')

    await prisma.$transaction(async (tx) => {
        // 1. Update Status
        await tx.creatorAchievement.update({
            where: { id: verificationId },
            data: {
                status: approved ? 'APPROVED' : 'REJECTED',
                // If approved, we can set awardedAt (if schema supports it) or rely on updatedAt
            }
        })

        // 2. If Approved and has reward, add to balance
        if (approved && submission.achievement.rewardAmount > 0) {
            await tx.affiliateProfile.update({
                where: { id: submission.creatorId },
                data: {
                    balance: {
                        increment: submission.achievement.rewardAmount
                    },
                }
            })

            // Log the "commission" or earnings? 
            // Ideally we should create a Commission record or similar Ledger entry, 
            // but for this MVP, updating the balance is the minimum viable step.
        }
    })

    revalidatePath('/staff/achievements')
    return { success: true }
}

export async function upsertAchievement(data: {
    id?: string
    name: string
    description: string
    icon: string
    category: string // Maps to 'type' in schema
    targetCount: number // Maps to 'threshold' in schema
    rewardType: string // Not in schema, ignoring or assuming logic handled elsewhere (maybe implicitly money)
    rewardAmount: number
    level: number
    metricKey?: string
}) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Valid types from schema context: VISITS_COUNT, EARNINGS_THRESHOLD, MANUAL, METRIC_THRESHOLD
    // We assume 'category' from frontend aligns with these or we default to MANUAL
    const type = data.category || 'MANUAL'

    if (data.id) {
        await prisma.achievement.update({
            where: { id: data.id },
            data: {
                name: data.name,
                description: data.description,
                icon: data.icon,
                type: type,
                threshold: data.targetCount,
                rewardAmount: data.rewardAmount,
                level: data.level,
                metricKey: data.metricKey
            }
        })
    } else {
        await prisma.achievement.create({
            data: {
                name: data.name,
                description: data.description,
                icon: data.icon,
                type: type,
                threshold: data.targetCount,
                rewardAmount: data.rewardAmount,
                level: data.level,
                metricKey: data.metricKey
            }
        })
    }

    revalidatePath('/staff/achievements')
    return { success: true }
}




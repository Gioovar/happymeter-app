'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getAllAchievements() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    return await prisma.achievement.findMany({
        orderBy: { level: 'asc' }
    })
}

export async function upsertAchievement(data: any) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    if (data.id) {
        // Update
        await prisma.achievement.update({
            where: { id: data.id },
            data: {
                name: data.name,
                description: data.description,
                instructions: data.instructions,
                icon: data.icon,
                rewardAmount: parseFloat(data.rewardAmount),
                level: parseInt(data.level),
                threshold: parseFloat(data.threshold || 0),
                type: data.type
            }
        })
    } else {
        // Create
        await prisma.achievement.create({
            data: {
                name: data.name,
                description: data.description,
                instructions: data.instructions,
                icon: data.icon || '🏆',
                rewardAmount: parseFloat(data.rewardAmount),
                level: parseInt(data.level),
                threshold: parseFloat(data.threshold || 0),
                type: data.type || 'MANUAL'
            }
        })
    }

    revalidatePath('/staff/achievements')
    revalidatePath('/creators/achievements')
    return { success: true }
}

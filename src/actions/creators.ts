'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateCreatorProfile(data: {
    paypalEmail: string
    instagram: string
    tiktok: string
    youtube: string
    twitch: string
    facebook: string
}) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    // Clean social links if empty
    const cleanData = {
        paypalEmail: data.paypalEmail || null,
        instagram: data.instagram || null,
        tiktok: data.tiktok || null,
        youtube: data.youtube || null,
        twitch: data.twitch || null,
        facebook: data.facebook || null
    }

    await prisma.affiliateProfile.update({
        where: { userId },
        data: cleanData
    })

    revalidatePath('/creators/profile')
    return { success: true }
}

export async function getMyPayouts() {
    const { userId } = await auth()
    if (!userId) return []

    const affiliate = await prisma.affiliateProfile.findUnique({
        where: { userId },
        include: {
            commissions: {
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!affiliate) return []

    return affiliate.commissions
}

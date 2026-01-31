'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function completeTour() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    await prisma.userSettings.upsert({
        where: { userId },
        update: { hasSeenTour: true },
        create: {
            userId,
            hasSeenTour: true
        }
    })


    revalidatePath('/dashboard')
}

export async function updateUserProfile(data: { phone: string, photoUrl: string, name: string, jobTitle: string }) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    await prisma.userSettings.upsert({
        where: { userId },
        update: {
            phone: data.phone,
            photoUrl: data.photoUrl,
            // @ts-ignore
            fullName: data.name, // Correctly mapping to fullName
            jobTitle: data.jobTitle,
            isOnboarded: true
        },
        create: {
            userId,
            phone: data.phone,
            photoUrl: data.photoUrl,
            // @ts-ignore
            fullName: data.name,
            jobTitle: data.jobTitle,
            isOnboarded: true
        }
    })

    revalidatePath('/ops')
    return { success: true }
}

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

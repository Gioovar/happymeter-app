'use server'

import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function mockBuyBranch(quantity: number) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // In a real app, verify Stripe Payment Intent ID here

        // Increment user limit
        await prisma.userSettings.update({
            where: { userId: user.id },
            data: {
                maxBranches: { increment: quantity }
            }
        })

        // Also record a "Sale" record if we had one, but UserSettings update is enough for logic
        // TODO: Create Sale record implementation if strict tracking needed

        revalidatePath('/chains')
        return { success: true }
    } catch (error: any) {
        console.error('Error buying branch:', error)
        return { success: false, error: error.message }
    }
}

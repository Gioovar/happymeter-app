'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const businessName = formData.get('businessName') as string
    const industry = formData.get('industry') as string
    const phone = formData.get('phone') as string
    const instagram = formData.get('instagram') as string
    const facebook = formData.get('facebook') as string
    const whatsappEnabled = formData.get('whatsappEnabled') === 'on'

    if (!businessName) throw new Error('Business name is required')

    const socialLinks = {
        instagram,
        facebook
    }

    const notificationPreferences = {
        whatsapp: whatsappEnabled,
        email: true // Default to true for now
    }

    try {
        await prisma.userSettings.upsert({
            where: { userId },
            update: {
                businessName,
                industry,
                phone,
                socialLinks,
                notificationPreferences
            },
            create: {
                userId,
                businessName,
                industry,
                phone,
                socialLinks,
                notificationPreferences,
                isOnboarded: true,
                plan: 'FREE'
            }
        })

        revalidatePath('/dashboard/settings')
        revalidatePath('/dashboard')

        return { success: true }
    } catch (error: any) {
        console.error('SERVER ACTION ERROR:', error)
        return { success: false, error: error.message || 'Error desconocido' }
    }
}

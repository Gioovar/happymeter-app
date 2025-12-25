'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const businessName = formData.get('businessName') as string
    const industry = formData.get('industry') as string
    const phone = formData.get('phone') as string
    const instagram = formData.get('instagram') as string
    const facebook = formData.get('facebook') as string
    const state = formData.get('state') as string
    const city = formData.get('city') as string
    // const website = formData.get('website') as string

    if (!businessName) throw new Error('Business name is required')

    const socialLinks = {
        instagram,
        facebook,
        // website
    }

    await prisma.userSettings.upsert({
        where: { userId },
        update: {
            businessName,
            industry,
            phone,
            socialLinks,
            isOnboarded: true,
            state,
            city
        },
        create: {
            userId,
            businessName,
            industry,
            phone,
            socialLinks,
            isOnboarded: true,
            plan: 'FREE',
            state,
            city
        }
    })

    redirect('/dashboard')
}

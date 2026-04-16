'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function completeOnboarding(formData: FormData) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const businessName = formData.get('businessName') as string
        const industry = formData.get('industry') as string
        const subcategories = formData.getAll('subcategories') as string[]
        const phone = formData.get('phone') as string
        const instagram = formData.get('instagram') as string
        const facebook = formData.get('facebook') as string
        const whatsappContact = formData.get('whatsappContact') as string
        const googleReviewUrl = formData.get('googleReviewUrl') as string
        const logoUrl = formData.get('logoUrl') as string
        const bannerUrl = formData.get('bannerUrl') as string

        if (!businessName) throw new Error('Business name is required')

        const socialLinks = {
            instagram,
            facebook,
        }

        // 1. Update User Settings
        await prisma.userSettings.upsert({
            where: { userId },
            update: {
                businessName,
                industry,
                subcategories,
                phone,
                socialLinks,
                whatsappContact,
                googleReviewUrl,
                logoUrl,
                bannerUrl,
                isOnboarded: true,
                isActive: true,
            },
            create: {
                userId,
                businessName,
                industry,
                subcategories,
                phone,
                socialLinks,
                whatsappContact,
                googleReviewUrl,
                logoUrl,
                bannerUrl,
                isOnboarded: true,
                isActive: true,
                plan: 'FREE',
            }
        })

        // 2. Initialize Chain (Headquarters)
        const existingChain = await prisma.chain.findFirst({ where: { ownerId: userId } })
        if (!existingChain) {
            await prisma.chain.create({
                data: {
                    name: businessName,
                    ownerId: userId,
                    branches: {
                        create: {
                            name: businessName,
                            branchId: userId,
                            order: 0
                        }
                    }
                }
            })
        }

        // 3. Initialize Loyalty Program
        const existingLoyalty = await prisma.loyaltyProgram.findUnique({ where: { userId } })
        if (!existingLoyalty) {
            await prisma.loyaltyProgram.create({
                data: {
                    userId,
                    businessName: businessName,
                    description: 'Programa de lealtad para nuestros clientes VIP.',
                    pointsPercentage: 5.0,
                    isActive: true
                }
            })
        }

        const { revalidatePath } = require('next/cache');
        revalidatePath('/dashboard', 'layout');
        revalidatePath('/', 'layout');

        return { success: true }
    } catch (error: any) {
        console.error("ONBOARDING CRASH:", error);
        return { success: false, error: String(error.stack || error.message || error) }
    }
}

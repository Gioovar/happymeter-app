'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

import { z } from 'zod'

export interface OnboardingData {
    instagram?: string
    tiktok?: string
    youtube?: string
    facebook?: string
    otherSocials?: string
    whatsapp: string
    niche: string
    audienceSize: string
    contentStrategy: string
}

export async function submitCreatorOnboarding(raw: OnboardingData) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    let data: z.infer<typeof onboardingSchema>; // Declare data outside try block

    const onboardingSchema = z.object({
        instagram: z.string().optional(),
        tiktok: z.string().optional(),
        youtube: z.string().optional(),
        facebook: z.string().optional(),
        otherSocials: z.string().optional(),
        whatsapp: z.string().min(8, "El WhatsApp es obligatorio para notificarte."),
        niche: z.string().min(1, 'Selecciona un nicho'),
        audienceSize: z.string().min(1, 'Selecciona audiencia'),
        contentStrategy: z.string().min(10, 'Cuéntanos un poco más')
    });

    try {
        data = onboardingSchema.parse(raw);
    } catch (e) {
        if (e instanceof z.ZodError) {
            const fieldErrors = e.flatten().fieldErrors
            const errorValues = Object.values(fieldErrors) as string[][]
            const firstError = errorValues[0]?.[0] || 'Error de validación'
            console.error('Validation Error:', fieldErrors)
            throw new Error(firstError)
        }
        console.error('Onboarding Error:', e)
        throw e
    }

    // Find profile
    let profile = await prisma.affiliateProfile.findUnique({
        where: { userId }
    })

    if (!profile) {
        // Auto-create on the fly if missing (Race condition fix)
        // This ensures new users who land directly on onboarding don't get 404

        // Need user details
        const { currentUser } = await import('@clerk/nextjs/server')
        const user = await currentUser()
        if (!user) throw new Error('User data not found')

        // 1. Ensure UserSettings exists (Foreign Key Requirement)
        let userSettings = await prisma.userSettings.findUnique({
            where: { userId: user.id }
        })

        if (!userSettings) {
            userSettings = await prisma.userSettings.create({
                data: {
                    userId: user.id,
                    role: 'USER',
                    plan: 'FREE',
                    businessName: `${user.firstName} ${user.lastName}`.trim() || 'Creator',
                }
            })
        }

        const baseCode = (user.firstName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '')
        const code = `${baseCode}${Math.floor(Math.random() * 1000)}`

        profile = await prisma.affiliateProfile.create({
            data: {
                userId: user.id,
                code: code,
                status: 'PENDING',
                commissionRate: 20.0,
                // We can hydrate other fields later in update
            }
        })
    }

    try {
        // Update profile
        await prisma.affiliateProfile.update({
            where: { id: profile.id },
            data: {
                instagram: data.instagram,
                tiktok: data.tiktok,
                youtube: data.youtube,
                facebook: data.facebook,
                otherSocials: data.otherSocials,
                whatsapp: data.whatsapp,
                niche: data.niche,
                audienceSize: data.audienceSize,
                contentStrategy: data.contentStrategy,
                // We can optionally trigger status change here if needed, 
                // but keeping it PENDING until manual review is safer.
            }
        })

        // 1. Send External Alert (WhatsApp Mock)
        const { sendCreatorSignupAlert } = await import('@/lib/alerts')
        await sendCreatorSignupAlert(profile.code, data.niche, data.audienceSize)

        // 2. Send Internal Notification (Admin Chat)
        // We create a system message in the admin chat
        const { prisma: prismaClient } = await import('@/lib/prisma')

        // Ensure chat exists
        let chat = await prismaClient.adminChat.findFirst({ where: { creatorId: profile.id } })
        if (!chat) {
            chat = await prismaClient.adminChat.create({ data: { creatorId: profile.id } })
        }

        await prismaClient.adminChatMessage.create({
            data: {
                chatId: chat.id,
                senderId: 'support-bot', // Marking as support bot or system
                content: `¡Hola! 👋 Bienvenido al equipo de creadores.\n\nHemos recibido tu perfil y lo estamos revisando para asignarte tu comisión.\n\nSi tienes alguna duda mientras esperas, escríbenos por aquí. ¡Estamos para ayudarte!`
            }
        })

        // Revalidate dashboard so redirection check passes
        revalidatePath('/creators/dashboard')
        revalidatePath(`/admin/creators/${userId}`)

        return { success: true }

    } catch (dbError) {
        console.error('DB Update Error:', dbError)
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError)
        throw new Error(`DB Error: ${errorMessage}`)
    }
}

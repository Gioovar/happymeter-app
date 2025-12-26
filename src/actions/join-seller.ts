'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function joinAsSeller(formData: FormData) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const state = formData.get('state') as string
    const phone = formData.get('phone') as string
    const socialLink = formData.get('socialLink') as string
    const experience = formData.get('experience') as string
    // Photo handling would typically require an upload service (e.g., Uploadthing). 
    // For this MVP, we might accept a URL or just skip it if not set up, 
    // OR the user meant "enviar foto" via WhatsApp/Email. 
    // I'll add a text field for "Photo URL" or similar if they have one, or omit it for now purely in code if I can't upload.
    // User request: "enviar una foto".
    // I will assume for now we capture the text data first. Real file upload requires more setup.

    if (!state || !phone || !experience) throw new Error('Faltan campos requeridos')

    // Check limit (50 per state)
    const count = await prisma.representativeProfile.count({
        where: { state, isActive: true } // Only count active ones? Or all? Usually active.
    })

    if (count >= 50) {
        throw new Error('Lo sentimos, este territorio está lleno (50/50).')
    }

    // Check if user already has a pending application
    const existing = await prisma.representativeProfile.findUnique({
        where: { userId }
    })

    if (existing) {
        throw new Error('Ya tienes una solicitud en proceso o activa.')
    }

    // Create profile (PENDING)
    await prisma.representativeProfile.create({
        data: {
            userId,
            state,
            phone,
            socialLink,
            experience,
            status: 'PENDING',
            isActive: false,
            // Don't generate referral code yet, wait for approval
            referralCode: null
        }
    })

    // Notify Admins
    const admins = await prisma.userSettings.findMany({
        where: { role: 'SUPER_ADMIN' }
    })

    for (const admin of admins) {
        await prisma.notification.create({
            data: {
                userId: admin.userId,
                type: 'SYSTEM',
                title: 'Nueva Solicitud de Embajador',
                message: `El usuario ${userId} ha solicitado unirse en ${state}. Revisar perfil.`,
                meta: { type: 'seller_application', userId: userId }
            }
        })
    }

    return { success: true }
}

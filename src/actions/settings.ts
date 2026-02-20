'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppTemplate } from '@/lib/alerts'

export async function updateSettings(formData: FormData) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const branchId = formData.get('branchId') as string | undefined
    let targetUserId = userId

    if (branchId && branchId !== userId) {
        // Verify Chain Ownership
        const branch = await prisma.chainBranch.findFirst({
            where: {
                branchId: branchId,
                chain: { ownerId: userId }
            }
        })
        if (!branch) throw new Error('Unauthorized access to branch settings')
        targetUserId = branchId
    }

    const businessName = formData.get('businessName') as string
    const industry = formData.get('industry') as string
    const phone = formData.get('phone') as string
    const instagram = formData.get('instagram') as string
    const facebook = formData.get('facebook') as string
    const whatsappEnabled = formData.get('whatsappEnabled') === 'on'
    const logoUrl = formData.get('logoUrl') as string | undefined
    const bannerUrl = formData.get('bannerUrl') as string | undefined

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
        const settings = await prisma.userSettings.upsert({
            where: { userId: targetUserId },
            update: {
                businessName,
                industry,
                phone,
                socialLinks,
                notificationPreferences,
                ...(logoUrl ? { logoUrl } : {}),
                ...(bannerUrl ? { bannerUrl } : {})
            },
            create: {
                userId: targetUserId,
                businessName,
                industry,
                phone,
                socialLinks,
                notificationPreferences,
                ...(logoUrl ? { logoUrl } : {}),
                ...(bannerUrl ? { bannerUrl } : {}),
                isOnboarded: true,
                plan: 'FREE'
            }
        })

        // Sync to ChainBranch (Critical for consistency)
        try {
            await prisma.chainBranch.updateMany({
                where: { branchId: targetUserId },
                data: { name: businessName }
            })
        } catch (e) {
            console.error("Error syncing chain branch name:", e)
        }

        // Sync to Loyalty Program if exists
        try {
            const program = await prisma.loyaltyProgram.findUnique({ where: { userId: targetUserId } })
            if (program) {
                await prisma.loyaltyProgram.update({
                    where: { id: program.id },
                    data: { businessName }
                })
            }
        } catch (e) {
            console.error("Error syncing loyalty program name:", e)
        }

        revalidatePath('/dashboard/settings')
        revalidatePath('/chains')
        revalidatePath('/dashboard/chains')
        return { success: true }
    } catch (error: any) {
        console.error('SERVER ACTION ERROR:', error)
        return { success: false, error: error.message || 'Error desconocido' }
    }
}

export async function getUserProfile() {
    const { userId } = await auth()
    if (!userId) return null

    const settings = await prisma.userSettings.findUnique({
        where: { userId }
    })

    // Count surveys
    const surveyCount = await prisma.survey.count({
        where: { userId }
    })

    return {
        phone: settings?.phone,
        surveyCount
    }
}

export async function updatePhoneNumber(phone: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    if (!phone || phone.length < 10) {
        throw new Error('Número inválido')
    }

    try {
        await prisma.userSettings.upsert({
            where: { userId },
            update: {
                phone,
                notificationPreferences: {
                    whatsapp: true, // Force enable
                    email: true
                }
            },
            create: {
                userId,
                phone,
                notificationPreferences: {
                    whatsapp: true,
                    email: true
                },
                isOnboarded: false // Don't mark full onboard if just phone
            }
        })
        return { success: true }
    } catch (error) {
        console.error('Update Phone Error:', error)
        return { success: false, error: 'Error al guardar teléfono' }
    }
}

export async function sendTestWhatsApp(phone: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    if (!phone || phone.length < 10) throw new Error('Inválido')

    try {
        const res: any = await sendWhatsAppTemplate(phone, 'new_survey_alertt', 'es_MX', [
            { type: 'text', text: "Verificación HappyMeter" },
            { type: 'text', text: "5" },
            { type: 'text', text: "¡Tu número funciona! Estás listo para recibir alertas." }
        ])

        return { success: true, debugPhone: res?.debugPhone }
    } catch (error: any) {
        console.error('Test WhatsApp Error:', error)
        return { success: false, error: error.message || 'Falló el envío' }
    }
}

'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppTemplate } from '@/lib/alerts'

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
        // revalidatePath('/dashboard') // Validation optimization: Avoid refreshing unrelated dashboard components

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

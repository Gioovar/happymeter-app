import { Response, Survey } from '@prisma/client'
import { sendResponseAlert } from '@/lib/email'

import { prisma } from '@/lib/prisma'

export async function sendCrisisAlert(response: Response, survey: Survey, answers: any[]) {
    try {
        const config = survey.alertConfig as any
        let shouldAlert = false
        let threshold = (config && config.threshold) || 2

        const ratingAnswer = answers.find(a => a.question.type === 'RATING' || a.question.type === 'EMOJI')
        if (!ratingAnswer) return

        const rating = parseInt(ratingAnswer.value)
        if (isNaN(rating)) return

        if (rating <= threshold) {
            shouldAlert = true
        }

        if (!shouldAlert) return

        // Fetch User Settings for Global Alerts
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: survey.userId }
        })

        const issueText = answers.find(a => a.value.length > 5 && a.question.type === 'TEXT')?.value || "Sin comentarios"
        const customerName = response.customerName || "Anónimo"
        const tableName = answers.find(a => a.question.text.toLowerCase().includes('mesa'))?.value || "N/A"

        let message = `Cliente: ${customerName}\nMesa: ${tableName}\nCalificación: ${rating} ⭐\n"${issueText}"`

        // Smart Recovery Configuration (Tiered)
        const recoveryConfig = (survey as any).recoveryConfig || {}
        let appliedReward = null

        if (rating >= 4) {
            if (recoveryConfig.good?.enabled) appliedReward = recoveryConfig.good
        } else if (rating === 3) {
            if (recoveryConfig.neutral?.enabled) appliedReward = recoveryConfig.neutral
        } else {
            // Bad (1-2) - Check 'bad' tier first, fallback to old single-level config if missing
            if (recoveryConfig.bad?.enabled) appliedReward = recoveryConfig.bad
            else if (recoveryConfig.enabled) appliedReward = { offer: recoveryConfig.offer, code: recoveryConfig.code }
        }

        if (appliedReward) {
            message += `\n\n🚑 RECUPERACIÓN INTELIGENTE:\nEnvía esto al cliente:\n"Hola ${customerName}, sentimos tu mala experiencia. Muestra este código *${appliedReward.code}* en tu próxima visita para *${appliedReward.offer}*."`
        }

        console.log('--- CREATING CRISIS ALERT ---')

        await prisma.notification.create({
            data: {
                userId: survey.userId,
                type: 'CRISIS',
                title: `🚨 Alerta de Crisis: ${survey.title}`,
                message: message,
                meta: { responseId: response.id, surveyId: survey.id }
            }
        })

        // Collect Phones
        const phones = new Set<string>()
        if (config && config.phones) {
            config.phones.forEach((p: string) => phones.add(p))
        }

        // Add Global Phone if WhatsApp enabled
        const globalWhatsapp = userSettings?.notificationPreferences ? (userSettings.notificationPreferences as any).whatsapp : false
        if (globalWhatsapp && userSettings?.phone) {
            phones.add(userSettings.phone)
        }

        // Send WhatsApp
        if (phones.size > 0) {
            console.log(`Sending WhatsApp to: ${Array.from(phones).join(', ')}`)
            for (const phone of Array.from(phones)) {
                await sendWhatsAppTemplate(phone, 'new_survey_alertt', 'es_MX', [
                    { type: 'text', text: customerName },
                    { type: 'text', text: rating.toString() },
                    { type: 'text', text: (issueText + (appliedReward ? `\n\n🚑 OFERTA: ${appliedReward.code} - ${appliedReward.offer}` : "")).substring(0, 60) }
                ])
            }
        }

        // Send Emails (keep existing logic restricted to config.emails? Or add global email?)
        // User only asked about WhatsApp. Keeping email logic as is for now.
        if (config && config.enabled && config.emails && config.emails.length > 0) {
            console.log(`Sending Email to: ${config.emails.join(', ')}`)
            for (const email of config.emails) {
                sendResponseAlert(
                    email,
                    survey.title,
                    rating,
                    response.id,
                    issueText
                ).catch(console.error)
            }
        }

        return true

    } catch (error) {
        console.error('Failed to send crisis alert', error)
        return false
    }
}

// CUSTOMER REWARD ALERT (Sent to Customer)
export async function sendCustomerReward(response: Response, survey: Survey, answers: any[]) {
    try {
        if (!response.customerPhone) return // No phone, no reward

        const ratingAnswer = answers.find(a => a.question.type === 'RATING' || a.question.type === 'EMOJI')
        if (!ratingAnswer) return

        const rating = parseInt(ratingAnswer.value)
        if (isNaN(rating)) return

        // Smart Recovery Configuration (Tiered)
        const recoveryConfig = (survey as any).recoveryConfig || {}
        let appliedReward = null

        if (rating >= 4) {
            if (recoveryConfig.good?.enabled) appliedReward = recoveryConfig.good
        } else if (rating === 3) {
            if (recoveryConfig.neutral?.enabled) appliedReward = recoveryConfig.neutral
        } else {
            // Bad (1-2)
            if (recoveryConfig.bad?.enabled) appliedReward = recoveryConfig.bad
            else if (recoveryConfig.enabled) appliedReward = { offer: recoveryConfig.offer, code: recoveryConfig.code }
        }

        if (!appliedReward) return

        console.log(`Sending Reward WhatsApp to Customer: ${response.customerPhone}`)

        // Using 'new_survey_alertt' as requested by user.
        // Template structure: Header (generic), Body with {{1}}, {{2}}, {{3}}
        // We map: {{1}} = Name, {{2}} = "¡PREMIO!", {{3}} = Reward Details
        await sendWhatsAppTemplate(response.customerPhone, 'new_survey_alertt', 'es_MX', [
            { type: 'text', text: response.customerName || 'Cliente' },
            { type: 'text', text: "¡PREMIO! 🎁" }, // Originally Rating, now used as Header/Subject
            { type: 'text', text: `Gracias por tu visita. Tu regalo: ${appliedReward.offer}. Código: ${appliedReward.code}. ¡Te esperamos!` } // Originally Comment, now full proper message
        ])

    } catch (error) {
        console.error('Error sending customer reward:', error)
    }
}

// Helper for Meta WhatsApp API
export async function sendWhatsAppTemplate(to: string, templateName: string, languageCode: string = 'es_MX', components: any[] = []) {
    try {
        const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN
        const phoneId = process.env.WHATSAPP_PHONE_ID

        if (!token || !phoneId) {
            console.warn('WhatsApp credentials missing in .env')
            throw new Error('Faltan credenciales de WhatsApp (Token o PhoneID)')
        }

        // Format Phone Number
        let formattedPhone = to.replace(/\D/g, '') // Remove non-digits
        if (formattedPhone.length === 10) {
            formattedPhone = '521' + formattedPhone
        } else if (formattedPhone.length === 12 && formattedPhone.startsWith('52')) {
            // Add '1' after 52 if it's missing (521... is 13 digits, 52... is 12)
            formattedPhone = '521' + formattedPhone.substring(2)
        } else if (formattedPhone.length > 10 && !formattedPhone.startsWith('52')) {
            // Assume if > 10 and not 52, it might be another country, but user requested default to MX logic. 
            // If they explicitly type +1..., we should probably respect it? 
            // For now, let's leave as is if it's not 10 digits, assuming user might have typed 52 already.
            // But if it starts with 044 or 045 (old MX format), strip it? 
            // Let's stick to the core request: auto-add 52 if missing.
        }

        // Ensure no + sign in the final API call payload for 'to', Meta expects just digits usually, 
        // but 'messaging_product' line handles standard formats.
        // Actually Meta API expects <CountryCode><Number>.

        console.log(`[WhatsApp] Sending to ${formattedPhone} (Original: ${to})`)

        const body = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
                name: templateName,
                language: { code: languageCode },
                components: [
                    {
                        type: "body",
                        parameters: components
                    }
                ]
            }
        }

        const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })

        const data = await res.json()
        if (!res.ok) {
            console.error('WhatsApp API Error:', JSON.stringify(data, null, 2))
            throw new Error(data.error?.message || 'Error en API de WhatsApp')
        } else {
            console.log('WhatsApp Sent:', data)
            return { ...data, debugPhone: formattedPhone }
        }
    } catch (e: any) {
        console.error('WhatsApp Send Failed:', e)
        throw new Error(e.message || 'Error de conexión con WhatsApp')
    }
}

export async function sendStaffAlert(response: Response, survey: Survey, answers: any[]) {
    try {
        console.log('--- PROCESSING STAFF ALERT ---')

        // 1. Prepare Message Content
        const issueDescription = answers.find(a =>
            a.question.type === 'TEXT' ||
            a.question.text.toLowerCase().includes('describe')
        )?.value || "Sin descripción"

        const evidence = answers.find(a =>
            a.question.type === 'FILE' ||
            a.question.text.toLowerCase().includes('evidencia')
        )?.value ? "📎 Con Evidencia Adjunta" : "Sin Evidencia"

        const message = `Nuevo Reporte en Buzón:\n"${issueDescription}"\n${evidence}`

        // 2. Create Internal System Notification
        await prisma.notification.create({
            data: {
                userId: survey.userId,
                type: 'SYSTEM', // Using SYSTEM type for general alerts
                title: '📩 Nuevo Reporte de Staff',
                message: message,
                meta: { responseId: response.id, surveyId: survey.id }
            }
        })

        // 3. Send Real WhatsApp Alert
        // Fetch User Settings for Global Alerts
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: survey.userId }
        })

        const config = survey.alertConfig as any
        const phones = new Set<string>()

        // Add phones from survey config
        if (config && config.phones) {
            config.phones.forEach((p: string) => phones.add(p))
        }

        // Add Global Phone if WhatsApp is enabled in preferences
        const globalWhatsapp = userSettings?.notificationPreferences ? (userSettings.notificationPreferences as any).whatsapp : false
        if (globalWhatsapp && userSettings?.phone) {
            phones.add(userSettings.phone)
        }

        if (phones.size > 0) {
            console.log(`[STAFF ALERT] Sending WhatsApp to: ${Array.from(phones).join(', ')}`)
            for (const phone of Array.from(phones)) {
                // Reuse existing template: {{1}}=Name, {{2}}=Rating, {{3}}=Msg
                // We adapt it: Name="Buzón Staff", Rating="REPORTE", Msg=Description
                await sendWhatsAppTemplate(phone, 'new_survey_alertt', 'es_MX', [
                    { type: 'text', text: "Buzón Staff" },
                    { type: 'text', text: "REPORTE" },
                    { type: 'text', text: issueDescription.substring(0, 60) }
                ])
            }
        }

        return true

    } catch (error) {
        console.error('Failed to send staff alert', error)
        return false
    }
}

export async function sendSupportAlert(userEmail: string, userName: string, message: string, contactInfo?: string) {
    try {
        console.log('--- PROCESSING SUPPORT ALERT ---')

        const fullMessage = `🆘 Solicitud de Ayuda Humana:\nUsuario: ${userName} (${userEmail})\nAsunto: "${message}"\nContacto: ${contactInfo || "No especificado"}`

        // 1. Create Internal System Notification for Super Admin (or generic system log)
        // Ideally this goes to a Super Admin dashboard, but for now we log it and maybe create a notification for the user confirming receipt.

        // We can create a notification for the USER confirming we got it.
        // And potentially email the ADMIN (simulated).

        console.log(`[EMAIL MOCK] Enviando alerta a soporte@happymeter.com...`)
        console.log(`[EMAIL CONTENT] ${fullMessage}`)

        return true

    } catch (error) {
        console.error('Failed to send support alert', error)
        return false
    }
}

export async function sendCreatorSignupAlert(creatorName: string, niche: string, audience: string) {
    try {
        console.log('--- PROCESSING CREATOR SIGNUP ALERT ---')

        const message = `🌟 Nuevo Creador en Espera:\nNombre: ${creatorName}\nNicho: ${niche}\nAudiencia: ${audience}\n\nRevisa el panel de admin para aprobarlo.`

        // Mock WhatsApp
        console.log(`[WHATSAPP MOCK] Enviando alerta a ADMINS...`)
        console.log(`[WHATSAPP CONTENT] ${message}`)

        // Here we would iterate over admin phone numbers and send the message
        return true
    } catch (error) {
        console.error('Failed to send creator alert', error)
        return false
    }
}

export async function sendCreatorMessageAlert(creatorName: string, message: string) {
    try {
        console.log('--- PROCESSING CREATOR MESSAGE ALERT ---')

        const alertText = `💬 Nuevo Mensaje de Soporte:\nCreador: ${creatorName}\nMensaje: "${message}"\n\nEntra al panel para contestar.`

        // Mock WhatsApp
        console.log(`[WHATSAPP MOCK] Enviando alerta a ADMINS...`)
        console.log(`[WHATSAPP CONTENT] ${alertText}`)

        return true
    } catch (error) {
        console.error('Failed to send creator message alert', error)
        return false
    }
}

export async function sendVisitRequestAlert(placeName: string, creatorName: string, visitDate: Date, creatorPhone?: string) {
    try {
        console.log('--- PROCESSING VISIT REQUEST ALERT ---')

        const dateStr = visitDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
        const message = `📅 Nueva Solicitud de Visita:\nLugar: ${placeName}\nCreador: ${creatorName}\nFecha: ${dateStr}\n\nRevisa el panel de Staff para aprobarla.`

        // 1. Find all Staff/Admins to notify
        const staffUsers = await prisma.userSettings.findMany({
            where: { role: { in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] } },
            select: { userId: true }
        })

        // 2. Create System Notification for each Staff member
        for (const staff of staffUsers) {
            await prisma.notification.create({
                data: {
                    userId: staff.userId,
                    type: 'SYSTEM',
                    title: '📅 Solicitud de Visita Pendiente',
                    message: message,
                }
            })
        }

        // 3. Mock WhatsApp to Staff (simulating sending to the "Manager")
        console.log(`[WHATSAPP MOCK] Notificando al Staff sobre solicitud de ${creatorName}...`)
        console.log(`[WHATSAPP CONTENT] ${message}`)

        return true
    } catch (error) {
        console.error('Failed to send visit status alert', error)
        return false
    }
}

export async function sendVisitStatusUpdateAlert(placeName: string, status: 'APPROVED' | 'REJECTED', creatorUserId: string, notes?: string) {
    try {
        const title = status === 'APPROVED' ? '✅ Visita Aprobada' : '❌ Visita Rechazada'
        const msg = `Tu solicitud para visitar "${placeName}" ha sido ${status === 'APPROVED' ? 'APROBADA' : 'RECHAZADA'}.${notes ? `\nNota: ${notes}` : ''}`

        // 1. Notify Creator internally
        await prisma.notification.create({
            data: {
                userId: creatorUserId,
                type: status === 'APPROVED' ? 'INFO' : 'SYSTEM',
                title: title,
                message: msg
            }
        })

        // 2. Mock WhatsApp to Creator
        console.log(`[WHATSAPP MOCK] Notificando al Creador (${creatorUserId}) sobre estado...`)
        console.log(`[WHATSAPP CONTENT] ${msg}`)

        return true
    } catch (error) {
        console.error('Failed to send visit status alert', error)
        return false
    }
}

export async function sendAchievementEvidenceAlert(creatorName: string, achievementName: string, evidenceUrl: string) {
    try {
        console.log('--- PROCESSING ACHIEVEMENT EVIDENCE ALERT ---')

        const message = `🏆 Nueva Evidencia de Logro:\nCreador: ${creatorName}\nLogro: ${achievementName}\n\nRevisa la evidencia para aprobar el pago.`

        // 1. Find all Staff/Admins
        const staffUsers = await prisma.userSettings.findMany({
            where: { role: { in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] } },
            select: { userId: true }
        })

        // 2. Create System Notification for each Staff
        for (const staff of staffUsers) {
            await prisma.notification.create({
                data: {
                    userId: staff.userId,
                    type: 'ACHIEVEMENT', // Specific type for correct icon
                    title: '🏆 Validación de Logro Pendiente',
                    message: message,
                    // We might add meta: { achievementId? } if needed later
                }
            })
        }

        // 3. Mock WhatsApp
        console.log(`[WHATSAPP MOCK] Notificando al Staff sobre logro de ${creatorName}...`)
        console.log(`[WHATSAPP CONTENT] ${message}`)

        return true
    } catch (error) {
        console.error('Failed to send achievement alert', error)
        return false
    }
}

export async function sendCreatorApprovedAlert(userId: string) {
    try {
        console.log('--- PROCESSING CREATOR APPROVED ALERT ---')

        const title = '🎉 ¡Perfil Aprobado!'
        const message = 'Tu cuenta de creador ha sido aprobada. Ya puedes comenzar a compartir tu código y solicitar visitas.'

        // 1. Notify Creator
        await prisma.notification.create({
            data: {
                userId: userId,
                type: 'INFO',
                title: title,
                message: message
            }
        })

        // 2. Mock WhatsApp
        console.log(`[WHATSAPP MOCK] Notificando aprobación a ${userId}...`)

        return true
    } catch (error) {
        console.error('Failed to send creator approval alert', error)
        return false
    }
}

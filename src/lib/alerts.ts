import { Response, Survey } from '@prisma/client'
import { sendResponseAlert } from '@/lib/email'

import { prisma } from '@/lib/prisma'

export async function sendCrisisAlert(response: Response, survey: Survey, answers: any[]) {
    try {
        // Parse config
        const config = survey.alertConfig as any
        /* 
           If user hasn't configured alerts explicitly, strictly speaking we might skip.
           BUT for the "Notification Dashboard" feature, we probably want to create the internal notification 
           regardless of whether they set up WhatsApp/Email. 
           Let's assume "Critical Reviews" (1-2 stars) always generate a dashboard alert 
           if enabled in config OR by default logic if we want.
           For now, let's respect the `config.enabled` or enforce it for low ratings.
           Let's safeguard: if no config, check rating <= 2 manually.
        */

        let shouldAlert = false
        let threshold = 2 // Default threshold

        if (config && config.enabled) {
            threshold = config.threshold || 2
        }

        // Check threshold
        const ratingAnswer = answers.find(a => a.question.type === 'RATING' || a.question.type === 'EMOJI')
        if (!ratingAnswer) return

        const rating = parseInt(ratingAnswer.value)
        if (isNaN(rating)) return

        // Trigger if rating is low enough (config driven or default bad < 3)
        if (rating <= threshold) {
            shouldAlert = true
        }

        if (!shouldAlert) return

        // Prepare Alert Payload
        const issueText = answers.find(a => a.value.length > 5 && a.question.type === 'TEXT')?.value || "Sin comentarios"
        const customerName = response.customerName || "Anónimo"
        const tableName = answers.find(a => a.question.text.toLowerCase().includes('mesa'))?.value || "N/A"

        const message = `Cliente: ${customerName}\nMesa: ${tableName}\nCalificación: ${rating} ⭐\n"${issueText}"`

        console.log('--- CREATING CRISIS ALERT ---')

        // 1. Create Dashboard Notification
        await prisma.notification.create({
            data: {
                userId: survey.userId,
                type: 'CRISIS',
                title: `🚨 Alerta de Crisis: ${survey.title}`,
                message: message,
                meta: { responseId: response.id, surveyId: survey.id }
            }
        })

        // 2. External Alerts (WhatsApp/Email) - Only if configured
        if (config && config.enabled) {
            // WhatsApp (Placeholder for now until templates active)
            if (config.phones && config.phones.length > 0) {
                console.log(`Sending WhatsApp to: ${config.phones.join(', ')}`)
            }

            // Email (REAL)
            if (config.emails && config.emails.length > 0) {
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
        }

        return true

    } catch (error) {
        console.error('Failed to send crisis alert', error)
        return false
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

        // 3. Simulate WhatsApp Alert
        // In a real implementation, we would fetch the user's phone number here
        console.log(`[WHATSAPP MOCK] Enviaando alerta a dueño del negocio...`)
        console.log(`[WHATSAPP COMPLETED] Mensaje enviado: ${message}`)

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

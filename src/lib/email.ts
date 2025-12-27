import { resend } from './resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { NewResponseEmail } from '@/emails/NewResponseEmail'
import { InvitationEmail } from '@/emails/InvitationEmail'

// Default sender
const SENDER = 'HappyMeter <onboarding@resend.dev>'

// In Production, this should be 'HappyMeter <alerts@tudominio.com>'

export async function sendDiplomaEmail(
    to: string,
    winnerName: string,
    monthStr: string,
    pdfBuffer: Buffer
) {
    if (!to) return

    try {
        await resend.emails.send({
            from: SENDER,
            to: [to],
            // bcc: ['admin@happymeter.app'], // Optional monitoring
            subject: `🏆 Diploma del Mes: ${winnerName}`,
            text: `¡Felicidades! Adjunto encontrarás el diploma de ${winnerName} por ser el empleado del mes de ${monthStr}.`,
            attachments: [
                {
                    filename: `Diploma_${winnerName.replace(/\s+/g, '_')}_${monthStr}.pdf`,
                    content: pdfBuffer,
                },
            ],
            // Use a simple React template or just text if template doesn't exist
            // For now, I'll assume we can create a simple DiplomaEmail or just fall back to text if I don't want to create a new file
            // Let's create a simple HTML body here if I don't import DiplomaEmail
            html: `
                <h1>🎉 ¡Reconocimiento Listo!</h1>
                <p>El sistema ha detectado a <strong>${winnerName}</strong> como el empleado con mejor desempeño del mes de <strong>${monthStr}</strong>.</p>
                <p>En el archivo adjunto encontrarás su diploma listo para imprimir.</p>
                <p>¡Sigue impulsando la excelencia!</p>
                <br>
                <p>El equipo de HappyMeter</p>
            `
        })
        console.log(`📧 Diploma sent to ${to}`)
    } catch (error) {
        console.error('Failed to send diploma email', error)
    }
}

// Default sender


export async function sendWelcomeEmail(to: string, firstName: string) {
    if (!to) return

    try {
        await resend.emails.send({
            from: SENDER,
            to: [to],
            subject: '¡Bienvenido a HappyMeter! 🚀',
            react: WelcomeEmail({ firstName }),
        })
        console.log(`📧 Welcome email sent to ${to}`)
    } catch (error) {
        console.error('Failed to send welcome email', error)
    }
}

export async function sendResponseAlert(
    to: string,
    surveyName: string,
    npsScore: number,
    responseId: string,
    comment?: string
) {
    if (!to) return

    try {
        const link = `https://www.happymeters.com/dashboard/responses/${responseId}`

        // Subject line varies by score to catch attention
        const emoji = npsScore <= 6 ? '🚨' : npsScore >= 9 ? '⭐' : '💬'
        const subject = `${emoji} Nueva Calificación: ${npsScore}/10 en ${surveyName}`

        await resend.emails.send({
            from: SENDER,
            to: [to],
            // Add Reply-To so they can reply to the customer if we had their email, 
            // but for now it's just a noreply alert.
            subject: subject,
            react: NewResponseEmail({
                surveyName,
                npsScore,
                comment,
                responseLink: link
            }),
        })
        console.log(`📧 Response alert sent to ${to}`)
    } catch (error) {
        console.error('Failed to send response alert', error)
    }
}

export async function sendInvitationEmail(
    to: string,
    inviterName: string,
    teamName: string,
    role: string,
    inviteLink: string
) {
    if (!to) return

    try {
        await resend.emails.send({
            from: SENDER,
            to: [to],
            subject: `💌 ${inviterName} te invitó a unirte a HappyMeter`,
            react: InvitationEmail({
                firstName: 'Colega', // Generic for now, as we don't have the invitee's name in `sendInvitationEmail` params typically
                inviterName,
                teamName,
                role,
                inviteLink
            }),
        })
        console.log(`📧 Invitation sent to ${to}`)
    } catch (error) {
        console.error('Failed to send invitation email', error)
        throw error // Rethrow so the UI knows it failed? Or suppress? Better to suppress usually but log.
    }
}

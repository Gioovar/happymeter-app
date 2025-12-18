import { resend } from './resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { NewResponseEmail } from '@/emails/NewResponseEmail'

// Default sender
const SENDER = 'HappyMeter <onboarding@resend.dev>'
// In Production, this should be 'HappyMeter <alerts@tudominio.com>'

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
        const link = `https://happymeter.app/dashboard/responses/${responseId}`

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

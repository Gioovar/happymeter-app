import { resend } from './resend'
import { WelcomeEmail } from '@/emails/WelcomeEmail'
import { NewResponseEmail } from '@/emails/NewResponseEmail'
import { InvitationEmail } from '@/emails/InvitationEmail'

// Default sender
// Default sender
export const DEFAULT_SENDER = 'HappyMeter <notificaciones@happymeters.com>'

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
            from: DEFAULT_SENDER,
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
            from: DEFAULT_SENDER,
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
            from: DEFAULT_SENDER,
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
    inviteLink: string,
    isOperator?: boolean,
    code?: string,
    firstName?: string,
    jobTitle?: string
) {
    if (!to) return

    try {
        const response = await resend.emails.send({
            from: DEFAULT_SENDER,
            to: [to],
            subject: isOperator
                ? `🔢 Tu Código de Acceso para Operaciones: ${code}`
                : `💌 ${inviterName} te invitó a unirte a HappyMeter`,
            react: InvitationEmail({
                firstName: firstName || 'Colega',
                inviterName,
                teamName,
                role,
                inviteLink,
                isOperator,
                code,
                jobTitle
            }),
        })
        console.log(`📧 Invitation sent to ${to}. ID: ${response.data?.id}`)
    } catch (error) {
        console.error('Failed to send invitation email', error)
        throw error
    }
}

export async function sendStaffAssignmentEmail(
    to: string,
    staffName: string,
    zoneName: string,
    managerName: string
) {
    if (!to) return

    try {
        await resend.emails.send({
            from: DEFAULT_SENDER,
            to: [to],
            subject: `📋 Nueva Asignación: Responsable de ${zoneName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #4f46e5;">Nueva Zona Asignada</h1>
                    <p>Hola <strong>${staffName}</strong>,</p>
                    <p><strong>${managerName}</strong> te ha asignado como responsable de la zona operativa: <strong>${zoneName}</strong>.</p>
                    <p>Ahora verás las tareas correspondientes a esta zona en tu panel de operaciones.</p>
                    <div style="margin: 30px 0;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/ops/tasks" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            Ver Mis Tareas
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Si crees que esto es un error, contacta a tu administrador.</p>
                </div>
            `
        })
        console.log(`📧 Assignment email sent to ${to}`)
    } catch (error) {
        console.error('Failed to send assignment email', error)
    }
}
export async function sendTeamAddedEmail(
    to: string,
    teamName: string,
    role: string,
    managerName: string,
    pin?: string
) {
    if (!to) return

    try {
        await resend.emails.send({
            from: DEFAULT_SENDER,
            to: [to],
            subject: `🚀 Has sido unido al equipo de ${teamName}`,
            html: `
                <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); color: #ffffff;">
                    
                    <div style="padding: 40px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Bienvenido a <span style="color: #8b5cf6;">${teamName}</span></h1>
                    </div>

                    <div style="padding: 40px;">
                        <p style="color: #a3a3a3; font-size: 16px; line-height: 24px;">Hola,</p>
                        <p style="color: #e5e5e5; font-size: 16px; line-height: 24px;"><strong>${managerName}</strong> te ha agregado oficialmente a su equipo en HappyMeter bajo el rol de <strong style="color: #8b5cf6; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">${role}</strong>.</p>
                        
                        ${pin ? `
                        <div style="margin: 30px 0; padding: 24px; background-color: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; text-align: center;">
                            <p style="color: #a3a3a3; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; font-weight: 600;">TU PIN DE ACCESO</p>
                            <div style="font-family: monospace; font-size: 36px; font-weight: 800; color: #ffffff; letter-spacing: 6px;">${pin}</div>
                            <p style="color: #737373; font-size: 13px; margin: 12px 0 0 0;">Usa este código en la app de Operaciones para tu Check-In.</p>
                        </div>
                        ` : ''}

                        <p style="color: #a3a3a3; font-size: 15px; line-height: 24px;">Tu cuenta ya estaba registrada, por lo que puedes acceder directamente usando tus credenciales de siempre o tu PIN operativo.</p>

                        <div style="margin: 40px 0; text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/ops/login" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; transition: all 0.2s ease;">
                                Iniciar Sesión en el Portal
                            </a>
                        </div>
                    </div>

                    <div style="background-color: #111111; padding: 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                        <p style="color: #525252; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} HappyMeter. Todos los derechos reservados.</p>
                    </div>
                </div>
            `
        })
        console.log(`📧 Team add email sent to ${to}`)
    } catch (error) {
        console.error('Failed to send team add email', error)
    }
}

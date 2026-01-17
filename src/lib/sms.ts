import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null

export async function sendSMS(to: string, body: string) {
    if (!client || !fromNumber) {
        console.warn('⚠️ Twilio Not Configured: SMS simulation mode')
        console.log(`[SMS] To: ${to} | Body: ${body}`)
        return { success: true, simulated: true }
    }

    try {
        const message = await client.messages.create({
            body,
            from: fromNumber,
            to
        })
        console.log(`[SMS] Sent: ${message.sid}`)
        return { success: true, sid: message.sid }
    } catch (error) {
        console.error("Error sending SMS via Twilio:", error)
        return { success: false, error: "Failed to send SMS" }
    }
}

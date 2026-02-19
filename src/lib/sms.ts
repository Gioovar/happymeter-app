import twilio from 'twilio'

export async function sendSMS(to: string, body: string) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
        console.warn('⚠️ Twilio Not Configured: SMS simulation mode')
        console.log(`[SMS] To: ${to} | Body: ${body}`)
        return { success: true, simulated: true }
    }

    try {
        const client = twilio(accountSid, authToken)

        // Normalize: If it doesn't start with +, assume Mexico (+52)
        let normalizedTo = to.trim()
        if (!normalizedTo.startsWith('+')) {
            // Remove any leading 0s or spaces
            normalizedTo = `+52${normalizedTo.replace(/^0+/, '')}`
        }

        console.log(`[SMS] Sending to: ${normalizedTo} (Original: ${to}) from: ${fromNumber}`)

        const message = await client.messages.create({
            body,
            from: fromNumber,
            to: normalizedTo
        })
        console.log(`[SMS] Sent: ${message.sid}`)
        return { success: true, sid: message.sid }
    } catch (error) {
        console.error("Error sending SMS via Twilio:", error)
        return { success: false, error: "Failed to send SMS" }
    }
}

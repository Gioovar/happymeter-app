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

        // Normalize: Remove spaces, hyphens and characters
        let normalizedTo = to.trim().replace(/[\s\-\(\)]/g, '')

        if (!normalizedTo.startsWith('+')) {
            // For Mexico: Remove common mobile prefixes (044, 045) and leading 0 or 1 
            // if it helps reach the 10-digit base number.
            let clean = normalizedTo.replace(/^(044|045|0|1)/, '')
            if (clean.length === 10) {
                normalizedTo = `+52${clean}`
            } else if (normalizedTo.length === 12 && normalizedTo.startsWith('52')) {
                normalizedTo = `+${normalizedTo}`
            } else {
                // Fallback for other cases
                normalizedTo = `+52${normalizedTo}`
            }
        }

        console.log(`[SMS] Sending to: ${normalizedTo} (Original: ${to}) from: ${fromNumber}`)

        const message = await client.messages.create({
            body,
            from: fromNumber,
            to: normalizedTo
        })
        console.log(`[SMS] Successfully sent to Twilio. SID: ${message.sid} | Status: ${message.status}`)
        return { success: true, sid: message.sid, status: message.status }
    } catch (error) {
        console.error("Error sending SMS via Twilio:", error)
        return { success: false, error: "Failed to send SMS" }
    }
}

export const sendWhatsAppNotification = async (
    to: string,
    template: string,
    data: any
) => {
    // Check if WhatsApp is enabled in env
    if (!process.env.WHATSAPP_API_TOKEN) {
        console.warn('⚠️ WhatsApp API Token missing. Notification simulated.')
        console.log(`[WhatsApp] To: ${to} | Template: ${template} | Data:`, data)
        return true
    }

    try {
        console.log(`[WhatsApp] Sending to ${to}...`)

        // Example implementation for Meta Cloud API (Facebook)
        const response = await fetch(`https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to,
                type: 'template',
                template: {
                    name: template,
                    language: {
                        code: 'es'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: Object.keys(data).map(key => ({
                                type: 'text',
                                text: String(data[key])
                            }))
                        }
                    ]
                }
            })
        })

        if (!response.ok) {
            const err = await response.json()
            console.error('[WhatsApp Error]', err)
            throw new Error('Failed to send WhatsApp')
        }

        return true
    } catch (error) {
        console.error('WhatsApp Service Error:', error)
        return false
    }
}

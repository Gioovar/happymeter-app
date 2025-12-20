
// Minimal standalone script to test WhatsApp API
// Simulates sendWhatsAppTemplate from src/lib/alerts.ts without dependencies
require('dotenv').config({ path: '.env' })

async function sendWhatsAppTemplate(to: string, templateName: string, languageCode: string = 'es_MX', components: any[] = []) {
    try {
        const token = "EAAXuE15MNoMBQJUVhovY6fD7W1U9TZAAQxGOJZC1jxrH9J5SVmZA3EE0ZCB7CCnjV2DhOgIJHKOQHwTUBHqjtyknqxAL0BlOGQxhqTg5scS3AWJN5xTHHvQZAxKaeLLsRYlQLlZBxo14ZAMijfZBkhH3kjDfEYRoRMUWuxZB3fN95gEIqsEhz2MCDdRc4uUiUJDRZAzAZDZD"
        const phoneId = process.env.WHATSAPP_PHONE_ID

        console.log('--- Config ---')
        console.log('Token exists:', !!token)
        console.log('Phone ID exists:', !!phoneId)
        console.log('Phone ID Value:', phoneId)

        if (!token || !phoneId) {
            console.warn('WhatsApp credentials missing in .env')
            return
        }

        // Format Phone Number Logic (Copied from source)
        let formattedPhone = to.replace(/\D/g, '') // Remove non-digits
        if (formattedPhone.length === 10) {
            formattedPhone = '52' + formattedPhone
        }

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
        } else {
            console.log('SUCCESS: WhatsApp Sent:', JSON.stringify(data, null, 2))
        }
    } catch (e) {
        console.error('WhatsApp Send Failed:', e)
    }
}

async function main() {
    // Test with a dummy number first to check Auth
    // Use the template 'hello_world' which is standard
    await sendWhatsAppTemplate('5512345678', 'hello_world', 'en_US', [])
}

main()

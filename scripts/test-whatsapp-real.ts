
import { sendWhatsAppTemplate } from '../src/lib/alerts'

async function main() {
    console.log('--- Testing WhatsApp Configuration ---')

    if (!process.env.WHATSAPP_ACCESS_TOKEN) {
        console.error('❌ WHATSAPP_ACCESS_TOKEN is missing')
    } else {
        console.log('✅ WHATSAPP_ACCESS_TOKEN is present')
    }

    if (!process.env.WHATSAPP_PHONE_ID) {
        console.error('❌ WHATSAPP_PHONE_ID is missing')
    } else {
        console.log('✅ WHATSAPP_PHONE_ID is present')
    }

    // Attempt to send to a test number (User's own number if known, otherwise a dummy valid MX number)
    // Using a likely invalid number to test AUTH, not delivery.
    // Meta API returns 200 "messages" even if number is not on WhatsApp, usually.
    // But if we use a fake number like 525500000000 it might be accepted.
    // Let's try to send to a generic test number.
    const testPhone = '525512345678'
    console.log(`Attempting to send test message to ${testPhone}...`)

    await sendWhatsAppTemplate(testPhone, 'hello_world', 'en_US', [])
}

main()

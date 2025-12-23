
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sendWhatsAppTemplate } from '@/lib/alerts'

export async function POST(
    req: Request,
    { params }: { params: { surveyId: string } }
) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const body = await req.json()
        const { phone } = body

        if (!phone) return new NextResponse("Phone required", { status: 400 })

        // 1. Prepare variations
        const clean = phone.replace(/\D/g, '')
        const tenDigits = clean.slice(-10)

        const formatA = '521' + tenDigits // Format 521 (Standard API)
        const formatB = '52' + tenDigits  // Format 52 (Direct format)

        // Helper to send raw
        const sendRaw = async (toNum: string, variant: string) => {
            const token = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
            const phoneId = process.env.WHATSAPP_PHONE_ID

            const res = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: toNum,
                    type: 'template',
                    template: {
                        name: 'new_survey_alertt',
                        language: { code: 'es_MX' },
                        components: [
                            {
                                type: 'body', parameters: [
                                    { type: 'text', text: `Prueba ${variant} (${toNum})` },
                                    { type: 'text', text: "5" },
                                    { type: 'text', text: "Si ves esto, este formato es el correcto." }
                                ]
                            }
                        ]
                    }
                })
            })
            return await res.json()
        }

        // Send Both
        const [resA, resB] = await Promise.all([
            sendRaw(formatA, 'A (521)'),
            sendRaw(formatB, 'B (52)')
        ])

        return NextResponse.json({
            success: true,
            details: {
                formatA: { phone: formatA, r: resA },
                formatB: { phone: formatB, r: resB }
            }
        })

    } catch (error: any) {
        console.error('[ALERT_TEST_POST]', error)

        // Debug Information
        const token = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
        const debugInfo = {
            message: error.message,
            tokenExists: !!token,
            tokenLength: token ? token.length : 0,
            phoneIdExists: !!process.env.WHATSAPP_PHONE_ID
        }

        return NextResponse.json({ success: false, error: error.message, debug: debugInfo }, { status: 500 })
    }
}

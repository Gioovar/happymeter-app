
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

        const clean = phone.replace(/\D/g, '')
        const tenDigits = clean.slice(-10)
        const formattedPhone = '521' + tenDigits

        const token = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
        const phoneId = process.env.WHATSAPP_PHONE_ID

        const whatsappBody = {
            messaging_product: 'whatsapp',
            to: formattedPhone,
            type: 'template',
            template: {
                name: 'new_survey_alertt',
                language: { code: 'es_MX' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: "Prueba Sistema" }, // {{1}}
                            { type: 'text', text: "10" },            // {{2}}
                            { type: 'text', text: "Verificación de Variables" } // {{3}}
                        ]
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
            body: JSON.stringify(whatsappBody)
        })

        const result = await res.json()
        return NextResponse.json({ success: true, details: { debugPhone: formattedPhone, ...result } })

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

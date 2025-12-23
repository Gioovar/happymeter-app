
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

        // Send Test Message
        // Template: new_survey_alertt
        // Params: {{1}}=Name, {{2}}=Rating, {{3}}=Comment
        await sendWhatsAppTemplate(phone, 'new_survey_alertt', 'es_MX', [
            { type: 'text', text: "Cliente de Prueba" },
            { type: 'text', text: "5" },
            { type: 'text', text: "¡Hola! Esta es una prueba de conexión exitosa desde HappyMeter." }
        ])

        return NextResponse.json({ success: true })

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

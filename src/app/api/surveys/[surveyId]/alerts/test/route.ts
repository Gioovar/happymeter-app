
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

    } catch (error) {
        console.error('[ALERT_TEST_POST]', error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

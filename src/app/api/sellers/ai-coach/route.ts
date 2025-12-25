
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()
        const { userId } = await auth()

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Verify Representative Profile
        const profile = await prisma.representativeProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: { businessName: true } // Just to have some context
                }
            }
        })

        if (!profile) {
            return new NextResponse("Forbidden: Not a Representative", { status: 403 })
        }

        // System Prompt - The Brain of the Coach
        const SYSTEM_PROMPT = `
        Actúa como 'HappyCoach', el entrenador experto de ventas de HappyMeter. Tu misión es ayudar al Representante (${profile.state}) a vender más suscripciones y gestionar su territorio.

        CONOCIMIENTO DE HAPPYMETER (Tu Base de Datos):
        1. **¿Qué es HappyMeter?**: Una plataforma que permite a los negocios medir la satisfacción de sus clientes en tiempo real mediante encuestas QR o enlaces.
        2. **Propuesta de Valor**:
           - **Recuperación Automática**: Detecta clientes insatisfechos y envía alertas de WhatsApp al gerente antes de que pongan una mala reseña en Google.
           - **Posicionamiento Google**: Invita a los clientes felices a dejar 5 estrellas en Google Maps.
           - **Ranking de Personal**: Mide qué mesero atiende mejor.
           - **Gamificación**: Juegos (ruleta, dados) para fomentar que el cliente conteste la encuesta.
           - **Marketing WhatsApp**: Envía promociones de regreso (ej. "Te extrañamos, ven por un postre gratis").
        
        3. **Precios y Planes**:
           - **FREE**: 30 encuestas/mes. Ideal para probar.
           - **BASIC ($499 MXN/mes)**: 300 encuestas, alertas básicas.
           - **PRO ($999 MXN/mes)**: Ilimitado, IA análisis, Campañas WhatsApp.
           - **ENTERPRISE**: Para cadenas.
           
        4. **Estrategia de Ventas (Consejos que das)**:
           - "No vendas software, vende paz mental (menos quejas públicas)."
           - "Ofrece el Plan Free para que se enganchen y luego haz upselling."
           - "Para restaurantes: Enfatiza el control de meseros y las reseñas de Google."
           - "Para hoteles: Enfatiza la detección temprana de problemas en habitaciones."

        TUS REGLAS DE INTERACCIÓN:
        - Sé motivador, breve y estratégico. "Lobo de Wall Street" pero ético y amable.
        - Si te preguntan "¿Cómo vendo esto?", da un guion paso a paso.
        - Si te preguntan precios, sé exacto.
        - Tu objetivo es que el Representante cierre tratos.
        - Habla siempre en español latinoamericano.
        - Usa emojis para dar dinamismo 🚀.

        CONTEXTO DEL USUARIO:
        - Estado asignado: ${profile.state}
        - Comisión actual: ${profile.commissionRate}%
        `

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                role: 'assistant',
                content: "Modo demo (Falta API Key): ¡Vamos a vender! Configura mi cerebro primero. 🧠",
            })
        }

        const model = getGeminiModel('gemini-flash-latest', {
            systemInstruction: SYSTEM_PROMPT
        })

        // Format history
        // Gemini requires alternating user/model
        const geminiHistory = messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }))

        const result = await model.generateContent({
            contents: geminiHistory
        })

        const responseText = result.response.text()

        return NextResponse.json({
            role: 'assistant',
            content: responseText
        })

    } catch (error: any) {
        console.error('[AI_COACH_POST]', error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}

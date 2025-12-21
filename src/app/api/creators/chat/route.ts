import { NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'

const SYSTEM_PROMPT = "Eres el 'HappyMeter Coach', un experto en marketing viral y creación de contenido para SaaS.\n" +
    "Tu objetivo es ayudar a los creadores de contenido a promocionar 'HappyMeter' (una plataforma de encuestas de satisfacción) para ganar comisiones.\n\n" +
    "Conocimiento sobre HappyMeter:\n" +
    "- Es la herramienta más fácil para medir la satisfacción del cliente (NPS, CSAT).\n" +
    "- Diseño hermoso y moderno, no aburrido como Google Forms.\n" +
    "- Plan gratuito generoso.\n" +
    "- Ideal para E-commerce, SaaS y Agencias.\n\n" +
    "Tus consejos deben ser:\n" +
    "- Cortos, energéticos y accionables.\n" +
    "- Sugerir 'Ganchos' (Hooks) para TikTok/Reels.\n" +
    "- Dar ideas de guiones.\n" +
    "- Explicar beneficios clave.\n" +
    "- Usar emojis y formato markdown.\n\n" +
    "Si te preguntan por beneficios: 'Retención de clientes', 'Diseño viral', 'Fácil de usar'.\n" +
    "Si te piden un gancho: 'Deja de perder clientes hoy mismo 🛑', '¿Tu negocio es una caja negra? 📦'."

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                role: 'assistant',
                content: "⚠️ **Configuración requerida:**\n\nPara que pueda funcionar a la perfección, necesitas configurar tu `GEMINI_API_KEY` en el archivo `.env`.\n\nPor ahora, estoy en modo simulación."
            })
        }

        const model = getGeminiModel('gemini-1.5-flash-8b', {
            systemInstruction: SYSTEM_PROMPT
        })

        // Map messages to Gemini Format
        // Map messages to Gemini Format
        let geminiHistory = messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }))

        // Gemini restriction: First message must be 'user'. 
        const firstUserIndex = geminiHistory.findIndex((m: any) => m.role === 'user')
        if (firstUserIndex !== -1) {
            geminiHistory = geminiHistory.slice(firstUserIndex)
        }

        const result = await model.generateContent({
            contents: geminiHistory
        })

        const responseText = result.response.text()

        return NextResponse.json({ role: 'assistant', content: responseText })

    } catch (error) {
        console.error('[AI_CHAT_POST]', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 })
    }
}

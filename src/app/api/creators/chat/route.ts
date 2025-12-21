import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
})

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

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                role: 'assistant',
                content: "⚠️ **Configuración requerida:**\n\nPara que pueda funcionar a la perfección, necesitas configurar tu `OPENAI_API_KEY` en el archivo `.env`.\n\nPor ahora, estoy en modo simulación."
            })
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...messages
            ],
            temperature: 0.7,
        })

        const responseText = completion.choices[0].message.content

        return NextResponse.json({ role: 'assistant', content: responseText })

    } catch (error) {
        console.error('[AI_CHAT_POST]', error)
        return new NextResponse("Error processing request", { status: 500 })
    }
}

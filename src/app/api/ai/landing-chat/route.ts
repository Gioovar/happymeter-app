import { NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { messages, businessType } = await req.json()

        const SYSTEM_PROMPT = `
        Eres la IA de Ventas de HappyMeter, una plataforma SaaS de feedback de clientes y gestión de reputación.
        
        TU MISIÓN:
        Convencer al visitante de que necesita HappyMeter. Debes actuar como un consultor experto y amigable.
        
        CONTEXTO DE HAPPYMETER:
        - Ayudamos a negocios a recolectar feedback real de sus clientes (QR, WhatsApp, Email).
        - Usamos IA para detectar problemas y fortalezas automáticamente.
        - Tenemos un Leaderboard de Empleados basado en calificaciones.
        - Generamos reportes automáticos con recomendaciones.
        
        FLUJO DE CONVERSACIÓN:
        1. BIENVENIDA (Si no hay mensajes previos):
           - NO USES FRASES DE MARKETING AGRESIVO.
           - Di algo cercano y humilde como: "Hola, ¿te gustaría saber si HappyMeter es para ti? Dime de qué trata tu negocio y te diré honestamente si tengo funciones que te ayuden a crecer."
           
        2. DESCUBRIMIENTO (Si el usuario saluda):
           - Insiste amablemente: "¿De qué es tu negocio? (Ej: Restaurante, Barbería...)"
           
        3. PITCH PERSONALIZADO (Cuando el usuario dice su negocio):
           - Si dice "Barbería", responde algo como: 
             "¡Excelente! Para tu Barbería, imagínate esto: Yo analizo lo que tus clientes piensan realmente, incluso cuando tú no estás ahí. Detecto si un barbero es estrella o si hay quejas recurrentes de espera. Absorbo toda esa información y te doy estrategias para que tus clientes regresen siempre. ¿Te gustaría ver una demo de esto?"
           - ADAPTA esto a cualquier negocio (Restaurante -> Calidad comida/servicio, Hotel -> Limpieza/Atención, etc).
           
        4. CIERRE (Si el usuario pregunta precio, demo o muestra mucho interés):
           - Invítalo a registrarse gratis o ver la demo completa.
           - "La mejor forma de entenderlo es probándolo. ¡Puedes empezar gratis ahora mismo! ¿Te animas?"

        TONO:
        - Profesional pero cercano y entusiasta.
        - Persuasivo (Sales-oriented).
        - Usa emojis ocasionalmente.
        - Respuesta CORTA y al grano (máximo 2-3 oraciones por turno).
        `

        // Check for API key presence to mock if needed during dev/build without env
        if (!process.env.GEMINI_API_KEY) {
            // Mock response behavior for dev
            const lastMsg = messages[messages.length - 1]?.content.toLowerCase() || ''
            let reply = "¡Hola! Soy la IA de HappyMeter. ¿De qué es tu negocio para explicarte cómo puedo ayudarte?"

            if (lastMsg.includes('barber') || lastMsg.includes('restaurante')) {
                reply = "¡Genial! Para tu negocio, HappyMeter analiza automáticamente las opiniones de tus clientes para detectar problemas y oportunidades de venta. ¡Es como tener un consultor de negocios 24/7!"
            }

            return NextResponse.json({ role: 'assistant', content: reply })
        }

        const model = getGeminiModel('gemini-flash-latest')

        // Construct chat history for Gemini
        // We add system prompt as first part or separate instruction depending on library version, 
        // usually simplest is to prepend to history or use systemInstruction if available.
        // For 'google-generative-ai' SDK, we can use chat session.

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                {
                    role: 'model',
                    parts: [{ text: "Entendido. Soy la IA de ventas de HappyMeter. Estoy lista para persuadir al cliente." }]
                }
                // ... map previous history if robust session needed, 
                // but for simple landing chat, usually just append last few messages works or use current context.
                // For simplicity and token saving, we'll just send the prompt + recent context as a single generation or short history.
            ]
        })

        // Convert simple message format to Gemini format
        // Ignoring full history reconstruction for this "stateless" lightweight implementation 
        // unless deeper context needed.
        // Let's just do a generateContent with the system prompt context + user input.

        const conversationHistory = messages.map((m: any) => `${m.role === 'user' ? 'CLIENTE' : 'IA'}: ${m.content}`).join('\n')
        const finalPrompt = `${SYSTEM_PROMPT}\n\nHISTORIAL DE CONVERSACIÓN:\n${conversationHistory}\n\nIA (Responde corto y persuasivo):`

        const result = await model.generateContent(finalPrompt)
        const responseText = result.response.text()

        return NextResponse.json({ role: 'assistant', content: responseText })

    } catch (error) {
        console.error('[LANDING_CHAT_API]', error)
        return new NextResponse("Error processing request", { status: 500 })
    }
}

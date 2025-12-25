import { NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { messages, businessType } = await req.json()

        // 1. Force Welcome Message (Static) to prevent LLM hallucinations or jumping to pitch
        if (!messages || messages.length === 0) {
            return NextResponse.json({
                role: 'assistant',
                content: "¡Hola! 👋 ¿Quieres saber por qué tus clientes no regresan? HappyMeter te lo dice.\n\nDime, ¿de qué trata tu negocio? (Ej: Restaurante, Barbería, Hotel...)"
            })
        }

        const SYSTEM_PROMPT = `
        Eres la IA de HappyMeter, experta en crecimiento de negocios físicos.

        TU CONOCIMIENTO MAESTRO (LAS FUNCIONES DE HAPPYMETER):
        
        1. 📡 SUPER-ENCUESTAS (El Cerebro):
           - No son encuestas aburridas. Son dinámicas y rápidas (QR, Link, WhatsApp).
           - "Modo Oculto": Detectamos de qué mesa o empleado viene la queja sin pedirlo.
        
        2. 🚨 ESCUDO EN TIEMPO REAL (Las Alertas):
           - Si un cliente califica bajo (1-3 estrellas), ¡BUM! Te llega un WhatsApp ANTES de que se vaya para que lo arregles.
           - "Arregla el problema en la mesa, no en la reseña".

        3. ⭐ POSICIONAMIENTO GOOGLE (SEO Automático):
           - Si el cliente califica BIEN (4-5 estrellas), lo enviamos directo a Google Maps.
           - Esto dispara tu visibilidad y posicionamiento orgánico. ¡Publicidad gratis!

        4. 📱 EL PODER EN TU MANO (CRM de Recuperación):
           - Tienes la base de datos de todos tus clientes en tu celular.
           - Botones directos para: Enviar WhatsApp, Llamar o Correos personalizados con un clic.
           - Recupera clientes perdidos hablando de tú a tú.

        5. 🎰 GAMIFICACIÓN (Sube el Ticket):
           - "Ruleta de Premios": El cliente juega a cambio de su opinión.

        6. 🕵️‍♂️ DETECTOR DE TALENTO (Staff Leaderboard):
           - Sabrás quién vende más y quién trata mejor a la gente.

        ESTRUCTURA DE TU RESPUESTA:
        1. 🥊 GANCHO DIRECTO: "¡Hola! ¿Quieres saber por qué tus clientes no regresan? HappyMeter te lo dice." (O usa el slogan si ya te dio el negocio).
        2. 📈 EXPERIENCIA: "Imagina tener el control total: Si alguien se queja, te aviso al instante. Si alguien te ama, lo mando a Google para que te suba el ranking."
        3. 🤝 CIERRE: "¿Te gustaría ver cómo recuperamos clientes perdidos con un solo clic?"

        REGLAS DE ORO:
        - Si preguntan "Qué hace?", responde: "Todo lo que tú no ves y no te reportan, HappyMeter te lo dice".
        - Vende la conversión de reseñas en dinero.
        
        Con esa data, mi IA te asesora en tiempo real. Por ejemplo: si alguien dice que las bebidas están calientes, te mando WhatsApp inmediato para que lo arregles en el momento.
        
        Además, incluimos dinámicas divertidas como una ruleta de shots para elevar tu ticket promedio y campañas de remarketing para que tus clientes vuelvan.
        
        👉 ¿Qué te gustaría que te explique primero: las encuestas, las alertas, los juegos o el marketing?"

        REGLAS:
        - ADAPTA ese ejemplo a Restaurantes, Hoteles, Tiendas, etc.
        - Sé persuasivo pero útil.
        - EMOCIONA al usuario con las posibilidades.
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

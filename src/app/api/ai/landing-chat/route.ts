import { NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { messages, businessType } = await req.json()

        const SYSTEM_PROMPT = `
        Eres la IA de HappyMeter, experta en crecimiento de negocios físicos.

        TU CONOCIMIENTO PROFUNDO (ÚSALO EN TUS RESPUESTAS):
        1. Encuestas Fáciles: Tú (el dueño) creas la encuesta -> Yo genero QR -> Cliente escanea y responde en segundos -> Yo leo todo (quejas, sugerencias).
        2. Alertas en Tiempo Real: Si alguien se queja (ej: "bebida caliente"), te mando WhatsApp AL INSTANTE para que lo arregles antes de que se vaya.
        3. Identificación de Estrellas: Detecto qué empleados son mencionados positivamente para que los recompenses.
        4. Educación: Te enseño con ejemplos de grandes marcas cómo resolver problemas.
        5. Recuperación de Clientes: Sistema automático para contactar clientes insatisfechos y recuperarlos.
        6. Gamificación: Mini-juegos y Ruleta de Shots para hacer divertida la experiencia y subir el ticket promedio.
        7. Marketing: Con la data recolectada, creamos campañas de remarketing en Meta y WhatsApp.

        ESTRUCTURA DE RESPUESTA (IMPORTANTE):
        - Cuando el usuario te diga su negocio, NO des una respuesta genérica. ADAPTA todo al giro del negocio (Hotel, Tienda, Clínica, etc.).
        - Usa el siguiente formato mental:
          1. Frase Gancho con el Slogan: "¡Perfecto! HappyMeter es ideal para un [Negocio]. Como decimos: 'Todo lo que tú no ves y no te reportan, HappyMeter te lo dice'."
          2. Explicación del Flujo: QR -> Encuesta -> Data.
          3. Beneficio Clave 1: Alertas WhatsApp (Ejemplo específico: "Si una habitación está sucia" para hotel, "Si tardan en cobrar" para tienda).
          4. Beneficio Clave 2: Gamificación/Marketing (Ejemplo específico).
          5. CIERRE CON PREGUNTA: "¿Qué te gustaría que te explique primero: las encuestas, las alertas, los juegos o el marketing?"

        EJEMPLO PARA "BAR":
        "¡Perfecto! HappyMeter te va a ayudar muchísimo con tu bar. Como decimos: 'Todo lo que tú no ves y no te reportan, HappyMeter te lo dice'.
        
        Tenemos un sistema de encuestas súper fácil..." (Resto igual, pero adaptado)

        REGLAS DE ADAPTACIÓN:
        - Si es HOTEL: Habla de limpieza, check-in, room service.
        - Si es TIENDA: Habla de atención de vendedores, disponibilidad de tallas.
        - Si es CLÍNICA: Habla de tiempos de espera, trato de enfermeras.
        - SIEMPRE usa el Slogan en la primera parte.
        
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

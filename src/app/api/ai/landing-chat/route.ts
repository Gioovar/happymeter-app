import { NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { messages, businessType } = await req.json()

        const SYSTEM_PROMPT = `
        Eres la IA de HappyMeter, experta en crecimiento de negocios físicos.

        TU CONOCIMIENTO MAESTRO (LAS FUNCIONES DE HAPPYMETER):
        
        1. 📡 SUPER-ENCUESTAS (El Cerebro):
           - No son encuestas aburridas. Son dinámicas y rápidas (QR, Link, WhatsApp).
           - "Modo Oculto": Detectamos de qué mesa o empleado viene la queja sin pedirlo.
        
        2. 🚨 ESCUDO EN TIEMPO REAL (Las Alertas):
           - Si un cliente califica bajo (1-3 estrellas) o menciona palabras clave ("bicho", "frío", "tardan"), ¡BUM!
           - Te llega un WhatsApp A TI (Dueño/Gerente) ANTES de que el cliente se vaya.
           - Evita quemadones en Google Maps. "Arregla el problema en la mesa, no en la reseña".

        3. 🕵️‍♂️ DETECTOR DE TALENTO (Staff Leaderboard):
           - La IA lee los comentarios y asigna puntos a tus meseros/vendedores.
           - Sabrás quién vende más, quién trata mejor a la gente y quién está "quemando" mesas.
           - Crea competencia sana con un Ranking en vivo.

        4. 🎰 GAMIFICACIÓN (Sube el Ticket):
           - "Ruleta de Premios": El cliente gira una ruleta digital para ganar algo (shot gratis, descuento) A CAMBIO de su feedback.
           - "Dados para Parejas": Juegos para romper el hielo en bares/restaurantes.
           - Esto hace que dejen de ver el celular y pidan más consumo.

        5. 🔄 RECUPERACIÓN AUTOMÁTICA (Marketing):
           - Si un cliente se va enojado, el sistema le manda un cupón automático de disculpa por WhatsApp/Email para que vuelva (¡y funciona!).
           - Campañas de Remarketing: Tienes la base de datos de tus clientes reales para hacerles pitas en Facebook/Instagram.

        6. 🧠 TU GERENTE IA (Consultoría):
           - No solo te doy gráficas. Te doy CONSEJOS.
           - "Oye, los martes bajan las ventas a las 6pm, ¿por qué no lanzamos 2x1 en margaritas?"
           - Análisis de Menú: "La gente ama la hamburguesa, pero odia las papas. Cambia de proveedor de papas".

        ESTRUCTURA DE TU RESPUESTA (SIEMPRE):
        1. 🎣 GANCHO + SLOGAN: "¡[Negocio] es perfecto para HappyMeter! Como decimos: 'Todo lo que tú no ves y no te reportan, HappyMeter te lo dice'."
        2. 🎯 EL PROBLEMA OCULTO: (Menciona un dolor típico de ese nicho. Ej: Robos hormiga, meseros groseros, comida fría).
        3. 🛠 LA SOLUCIÓN (Usa 2-3 funciones de arriba ADAPTADAS).
        4. ❓ CIERRE DE PODER: "¿Qué te preocupa más hoy: que tus clientes no vuelvan o que tus empleados no estén vendiendo bien?"

        REGLAS DE ORO:
        - Nunca digas "Tenemos funciones". Di "Imagina que..." o "Lo que logramos es..."
        - Vende la TRANSFORMACIÓN, no el software.
        - Sé empático pero experto. Tienes autoridad.
        
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

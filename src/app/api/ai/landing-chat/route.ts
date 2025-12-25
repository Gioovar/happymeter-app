import { NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { messages, businessType } = await req.json()

        // 1. Force Welcome Message (Static) to prevent LLM hallucinations or jumping to pitch
        if (!messages || messages.length === 0) {
            return NextResponse.json({
                role: 'assistant',
                content: "¡Hola! 👋 ¿Quieres descubrir cómo funciona HappyMeter?\n\nDéjame mostrarte cómo podemos ayudarte a tener clientes más felices, más reseñas ⭐⭐⭐⭐⭐ y más ventas 📈\n\nCuéntame, ¿qué tipo de negocio tienes? (Ej: Restaurante, Barbería, Hotel, Gym, Spa, etc.)\n\nYo te digo si HappyMeter es para ti 😉"
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

        7. 🗣️ BUZÓN DE STAFF (Mejora Interna):
           - Encuestas privadas para tus empleados.
           - Detecta "manzanas podridas" y recibe **Ideas de Mejora** de tu propio equipo.
           - "Tus empleados ven cosas que tú no. Escúchalos."

        ESTRUCTURA DE CONVERSACIÓN (4 FASES FLUIDAS):

        ESTRUCTURA DE CONVERSACIÓN (4 FASES FLUIDAS):

        FASE 1: EL DIAGNÓSTICO (El Dolor):
        - Valida el negocio.
        - Menciona un dolor fuerte típico de ese sector.
        - **Pregunta clave:** "¿Cuál es el mayor problema en tu negocio hoy: que los clientes no regresan o que no te llegan nuevos?"

        FASE 2 Y 3: LA SOLUCIÓN DUAL (El mensaje PODEROSO):
        - Úsalo cuando respondan al problema (sea cual sea).
        - *Mensaje EXACTO:*
          "¡Genial! Eso significa que necesitas un sistema dual, que ataque la raíz de ambos problemas.

          1. **El Sistema de Recuperación Inteligente (Retención):**
          Si hay una queja (1-3 estrellas), te avisamos por WhatsApp al instante para que arregles el error en la mesa. Si el cliente ya se fue, nuestro sistema automáticamente le envía un cupón de "perdón" para garantizar su regreso.
          👉 *Convertimos quejas en segundas oportunidades.*

          2. **La Fama Digital (Adquisición):**
          Si el cliente califica bien (4-5 estrellas), los enviamos directo a Google Maps y a tus Redes Sociales.
          👉 *Disparas tu visibilidad en Google y conviertes clientes felices en publicidad gratis.*

          ¿Te gustaría ver cómo HappyMeter te ayuda a recuperar clientes perdidos y a llenar tu restaurante con nuevos comensales?"

        FASE 4: EL CIERRE (40% Crecimiento):
        - Si dicen "Sí" a lo anterior.
        - *Mensaje EXACTO:*
          "¡Perfecto! Es hora de tomar el control. 🏆

          HappyMeter no es solo un software, es tu copiloto de crecimiento.

          **HappyMeter te da:**
          ✅ **Super-Encuestas** (QR, Link y WhatsApp)
          ✅ **Alertas en Tiempo Real** (¡Adiós malas experiencias!)
          ✅ **Recuperación Automática** (Cupones de perdón)
          ✅ **Posicionamiento** en Google Maps y Redes Sociales
          ✅ **Gamificación** (Ruleta de Premios para clientes)
          ✅ **Detector de Staff** (Mide el desempeño de tu equipo)

          Prueba HappyMeter **GRATIS por 7 Días**. Te ayudaremos a recuperar a tus clientes perdidos y a disparar tus ventas hasta ese **40%**.

          👇 **Comienza tu prueba aquí:**
          [Comenzar Prueba Gratis 🚀](/sign-up)"

        REGLAS:
        - ADAPTA LIGERAMENTE si no es restaurante (ej: "llenar tu barbería").
        - Usa exactamente las frases "Convertimos quejas en segundas oportunidades" y "Disparas tu visibilidad".
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

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
        Eres la IA de HappyMeter, tu rol no es ser un chatbot, eres un **Cerebro Operativo** y experto en crecimiento de negocios físicos.
        Tu misión es educar al dueño de negocio para que entienda que HappyMeter no es "otro software", sino su **Supervisor Digital con IA**.

        🧠 **CONOCIMIENTO MAESTRO (LA VERDAD DE HAPPYMETER):**
        HappyMeter es una plataforma inteligente que convierte el caos operativo en decisiones claras.
        No es una herramienta aislada. Es un sistema integral que escucha clientes, supervisa staff y controla ventas.

        🔥 **TUS 5 PODERES PRINCIPALES (FUNCIONES CLAVE):**

        1. 📡 **ENCUESTAS INTELIGENTES (El Oído):**
           - No solo "recopilamos datos". La IA lee, interpreta y detecta patrones.
           - "Modo Oculto": Sabemos de qué mesa o mesero viene la queja sin preguntarlo.
           - **Beneficio:** Convierte opiniones en estrategias.

        2. 🤝 **SISTEMA DE LEALTAD (El Hábito):**
           - Personalizable por **Puntos** (Ticket alto) o **Visitas** (Frecuencia).
           - **Beneficio:** Rompe la inercia del cliente. Deja de ser "una opción" y conviértete en su "rutina".
           - **Protección:** Es más barato regalar un postre al cliente fiel que hacer descuentos del 20% a extraños.

        3. ✅ **PROCESOS Y SUPERVISIÓN (El Supervisor Digital):**
           - Tu "policía bueno". Asigna tareas con hora exacta (ej. "Barra lista 2:00 PM").
           - Exige evidencia en **VIDEO**.
           - **Beneficio:** Elimina el "sí lo hice" sin pruebas. Si no cumplen, te alertamos al instante. Delega con control.

        4. 📅 **SISTEMA DE RESERVAS (La Independencia):**
           - Sistema PROPIO. Mapa real de tu negocio (mesas, zonas).
           - **Beneficio:** Cero comisiones. No dependas de apps que cobran por TUS clientes. Quédate con la base de datos.

        5. 🤖 **ASISTENTE VIRTUAL CON IA:**
           - Un chat que lo sabe todo. Cruza datos de encuestas, staff y ventas.
           - Pregúntale: "¿Cuál fue el peor problema de hoy?" y te responderá con análisis real.

        💰 **PRECIOS Y PLANES (LA OFERTA IRRESISTIBLE):**
        - **🟢 Starter (GRATIS):** Prueba total por 7 días sin riesgo.
        - **🔵 Growth ($699 MXN/mes):** Incluye Encuestas, Lealtad (1,000 respuestas), Alertas y Recuperación.
        - **🔴 Power ($2,199 MXN/mes):** Todo lo anterior + **Sistema de Reservaciones Propio** (Mapa, 0% comisiones).
        *Se cobra por sucursal.*

        🛠️ **DUDAS TÉCNICAS (MATANDO OBJECIONES):**
        - **¿Instalación?** NINGUNA. Funciona en el navegador.
        - **¿Tablets?** NO NECESARIAS. El staff usa sus propios celulares.
        - **¿POS?** Puede integrarse (cotización aparte), pero NO ES OBLIGATORIO. De hecho, es mejor tener un sistema independiente que audite al POS.

        🥊 **TU POSICIONAMIENTO:**
        - No compites con OpenTable o SurveyMonkey.
        - Compites contra: **La falta de control, la improvisación y las decisiones a ciegas.**
        - "HappyMeter ve lo que el dueño no puede ver".

        CASOS DE USO Y RESPUESTAS MAESTRAS:

        - **Si preguntan PRECIO:**
          "Tenemos planes desde $699 MXN al mes. Pero lo mejor es que inicies con la **Prueba Gratuita de 7 Días**.
          HappyMeter se paga solo recuperando 1 sola mesa al mes. ¿Te gustaría probarlo sin compromiso?"

        - **Si dicen "MIS CLIENTES NO REGRESAN" (Falta de Lealtad):**
          "Es el problema #1. Tu producto es bueno, pero no has creado un **Hábito**.
          Con nuestro Sistema de Lealtad, le das al cliente un motivo real para volver (la 5ta visita gratis, por ejemplo).
          Convertimos visitas casuales en clientes frecuentes."

        - **Si dicen "NO TENGO CONTROL / MI STAFF FALLA" (Falta de Supervisión):**
          "Necesitas un **Supervisor Digital**. Con la función de Procesos, HappyMeter exige evidencia en VIDEO de cada tarea.
          Si no cumplen, te avisa. Si cumplen, los califica.
          Elimina las excusas y pon orden sin tener que estar ahí peleando."

        - **Si dicen "PAGO MUCHAS COMISIONES EN RESERVAS":**
          "Eso es pagar renta por tus propios clientes.
          Con el plan Power de HappyMeter, tienes tu propio sistema de reservas. Cero comisiones.
          Tú eres dueño de la base de datos y de la relación con tu cliente."

        - **Si preguntan "¿QUÉ HACES TÚ EXACTAMENTE?":**
          "Soy tu Estratega de IA. No solo te doy datos, te doy decisiones.
          Leo tus encuestas, superviso a tu staff y te digo exactamente dónde estás perdiendo dinero y cómo recuperarlo."

        REGLAS DE CONVERSACIÓN NATURAL ❤️:
        1. **REFLEJA:** Si escriben corto, responde corto.
        2. **VALIDA:** "Te entiendo perfectamente...", "Es un dolor común...".
        3. **CIERRA:** Siempre termina con una pregunta para avanzar (ej. "¿Te hace sentido?", "¿Lo probamos gratis?").
        
        ⛔ PROHIBIDO:
        - HTML, Blockquotes, Markdown complejo. SOLO texto plano y emojis.
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

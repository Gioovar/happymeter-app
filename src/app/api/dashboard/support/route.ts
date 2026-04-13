export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getGeminiModel } from '@/lib/gemini'

const KNOWLEDGE_BASE = `
INFORMACIÓN DE HAPPYMETER (TU CONTEXTO):
1. **Encuestas Personalizadas**:
   - Se crean en Dashboard > Crear Nueva.
   - Tipos: Satisfacción (Clientes) y Buzón Staff (Empleados).
   - Puedes personalizar preguntas, colores y logos.
   - Las preguntas "Qué, Cuándo, Evidencia" son automáticas en el Buzón Staff.

2. **Códigos QR**:
   - Se generan automáticamente para cada encuesta.
   - Puedes descargarlos en formato imagen o PDF para imprimir.
   - Se encuentran en el icono de "Compartir" de cada encuesta.

3. **Reportes con IA**:
   - HappyMeter no solo muestra gráficas, usa IA para generar "Planes de Acción".
   - Botón "Crear Reporte" en Dashboard > Reportes.
   - Analiza tendencias, sentimientos y da pasos concretos para mejorar.

4. **Alertas de Crisis**:
   - Notificaciones automáticas cuando alguien califica con 1 o 2 estrellas.
   - Se configuran en Dashboard > Configuración > Alertas.
   - Puedes recibir alertas por Email o (simulado) WhatsApp.

5. **Facturación y Planes**:
   - Gestionados vía Stripe.
   - Dashboard > Configuración > Suscripción.
   - Planes: Básico (1 encuesta), Pro (Ilimitadas + IA), Enterprise.

6. **Buzón Staff (Anónimo)**:
   - Herramienta para que empleados reporten problemas sin miedo.
   - Totalmente anónimo (no guarda nombre ni email del empleado).
   - Oculta automáticamente campos de marketing (Google Maps/Redes).

7. **Campañas de Marketing (Meta & WhatsApp)**:
   - **Descargar Datos**:
     1. Ve a Dashboard > Campañas.
     2. Haz clic en "Descargar Datos" (CSV).
     3. Puedes filtrar por "Clientes Felices" (Promotores) o "Insatisfechos" (Detractores).
   - **Meta Ads (Facebook/Instagram)**:
     1. Entra a business.facebook.com > Públicos (Audiences).
     2. Crear Público > Público Personalizado > Lista de Clientes.
     3. Sube el CSV que descargaste. Meta encontrará sus perfiles.
     4. ¡Listo! Crea un anuncio dirigido solo a esa lista (ej. "¡Vuelve con nosotros!" para insatisfechos).
   - **WhatsApp Marketing**:
     1. Usa el CSV descargado para crear una "Lista de Difusión" en WhatsApp Business.
     2. Importa los contactos en tu celular o herramienta de envíos masivos.
     3. Envía mensajes personalizados (ej. "Gracias por tu visita, aquí tienes un cupón").

8. **Juegos Digitales (Gamificación)**:
   - **Objetivo**: Entretener a clientes mientras esperan o aumentar el consumo.
   - **Categorías**:
     - **Bar/Antro**: Ruleta de Shots, Botella, Verdad o Reto.
     - **Restaurantes**: Pac-Chef (Pacman), Viborita Coop.
     - **Cafés**: Zoltan el Oráculo, Lectura de Mano (AI).
     - **Hoteles**: Dados del Deseo (Parejas).
   - **Cómo usar**:
     1. Ve a Dashboard > Juegos.
     2. Selecciona el juego y personalízalo (premios, logo, castigos).
     3. Genera e imprime el QR para poner en las mesas.
   - **AI**: Algunos juegos como Zoltan y Hand Reader usan Inteligencia Artificial real para responder.
`

const SYSTEM_PROMPT = `Eres 'Soporte HappyMeter', un asistente experto en la plataforma HappyMeter.
Tú misión es ayudar a los usuarios a configurar sus cuentas, entender las funciones y resolver dudas técnicas.

TU CONOCIMIENTO:
${KNOWLEDGE_BASE}

REGLAS DE INTERACCIÓN:
1. **Sé Breve y Directo**: No des rodeos. Si preguntan cómo crear una encuesta, di los pasos 1, 2, 3.
2. **Tono Amigable pero Profesional**: Eres un asistente técnico útil. Usa emojis ocasionalmente (🛠️, ✨, 🚀).
3. **Escalación**: Si el usuario parece frustrado o el problema es un "bug" técnico que no puedes resolver (ej. "mi pantalla está en blanco"), sugiéreles usar el botón "Hablar con un Humano".
4. **No Alucines**: Si no sabes algo sobre la app que no esté en tu base de conocimiento, di "No tengo esa información específica, pero puedo conectarte con un agente humano".
5. **Idioma**: Responde siempre en Español.

FORMATO:
Usa Markdown para listas o negritas.`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const { userId } = await auth()

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[SUPPORT_CHAT] Missing GEMINI_API_KEY. Returning demo response.')
      return NextResponse.json({
        role: 'assistant',
        content: "Modo demo: Hola, soy tu asistente. Parece que la llave de IA (GEMINI_API_KEY) no está configurada en este entorno, así que no puedo generar respuestas inteligentes reales por ahora. Por favor configúrala en Vercel."
      })
    }

    // Using gemini-flash-latest now that billing is enabled (429 should be gone)
    const model = getGeminiModel('gemini-flash-latest', {
      systemInstruction: SYSTEM_PROMPT
    })

    // Map messages to Gemini Format
    // Map messages to Gemini Format
    let geminiHistory = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    // Gemini restriction: First message must be 'user'. 
    // We drop leading 'model' messages (like the welcome greeting).
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
    console.error('[SUPPORT_CHAT_ERROR]', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 })
  }
}

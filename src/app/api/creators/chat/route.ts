import { NextResponse } from 'next/server'
import { getGeminiModel } from '@/lib/gemini'

const SYSTEM_PROMPT = `Eres el 'HappyMeter Content Coach', experto en marketing viral y estrategias de crecimiento para restaurantes.
Tu misión es ayudar a creadores y afiliados a vender HappyMeter (plataforma de inteligencia y satisfacción) usando ángulos de venta irresistibles.

### 🧠 TUS SUPERPODERES (Base de Conocimiento)
HappyMeter no es solo una encuesta, tiene 3 pilares clave que debes destacar:
1. 🚑 **Recuperación Inteligente**: Convierte 1 estrella en cliente fiel. La IA detecta quejas, redacta disculpas y envía cupones automáticamente para que regresen.
2. 🍽️ **Inteligencia de Menú**: El menú habla. Descubre platillos estrella (para subir precio) y platos problema (para arreglar) basados en reseñas reales.
3. 🏆 **Gamificación para Meseros**: Motiva al staff automáticamente. Detecta al mejor mesero de la semana y le envía un diploma digital.
4. 🎡 **Experiencia Divertida (Juegos)**: Las encuestas no aburren, ¡divierten! Tenemos Ruleta, Botella y dados. La gente *quiere* opinar para ganar premios.
5. 🧠 **El Mejor Asesor de Negocios**: HappyMeter IA lo ve todo. Analiza miles de datos reales y le dice al dueño exactamente qué hacer. Es como tener un consultor experto 24/7 que conoce tu negocio mejor que nadie.

### 📝 RECURSOS DE CONTENIDO (Úsalos para dar ejemplos)

**1. Ideas para RRSS (TikTok/Reels):**
- *Gancho 1 (Miedo)*: "¿Tu restaurante es una caja negra? 📦 Sabes cuánto vendes, pero no por qué te dejan de comprar."
- *Gancho 2 (Diversión)*: "Deja de aburrir a tus clientes con encuestas de papel 📄. Haz que JUEGUEN con tu marca 🎡."
- *Gancho 3 (Autoridad)*: "Imagina tener un consultor que lee cada mente de tus clientes y te dice cómo vender más. Eso es HappyMeter."
- *Guion Rápido*: Muestra una encuesta aburrida (blanco y negro) -> TRANSICIÓN -> Muestra la Ruleta de HappyMeter girando en un celular. Texto: "Convierte opiniones en juegos".

**2. Copy para Ventas/Landing:**
- "HappyMeter no solo mide satisfacción... 🔥 rescata clientes, 🔥 optimiza tu menú, 🔥 motiva a tu equipo."
- "Deja de operar a ciegas. Toma decisiones con datos reales, no con corazonadas."

**3. Pitch de Venta (Argumento de Cierre):**
- "La mayoría de plataformas te dicen si tus clientes están felices. HappyMeter te dice CÓMO venderles más y CÓMO evitar que se vayan."

### 🎯 TU ESTILO
- Energético, directo y persuasivo.
- Usa emojis estratégicos (🔥, 🚀, 💰).
- **NO** des consejos genéricos ("publi constante"). Da **scripts específicos** y **ganchos visuales**.
- Si preguntan "¿Qué digo en el video?", dales un guion escena por escena.
- Si preguntan "Beneficios", enfócate en: Retención (Dinero), Menú (Optimización) y Equipo (Ahorro de tiempo).

¡Ayúdalos a crear contenido que convierta vistas en comisiones!`

export async function POST(req: Request) {
    try {
        const { messages } = await req.json()

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                role: 'assistant',
                content: "⚠️ **Configuración requerida:**\n\nPara que pueda funcionar a la perfección, necesitas configurar tu `GEMINI_API_KEY` en el archivo `.env`.\n\nPor ahora, estoy en modo simulación."
            })
        }

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

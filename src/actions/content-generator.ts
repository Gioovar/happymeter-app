'use server'

import { getGeminiModel } from '@/lib/gemini'
import { getSurveyAnalytics } from '@/actions/analytics'

export async function generateCampaignCopy(
    segment: string,
    platform: 'meta' | 'whatsapp',
    surveyTitle: string,
    surveyId: string = 'all'
): Promise<string[]> {
    try {
        // 1. Fetch Context via Analytics
        // We use skipAI=true to get fast metrics/weaknesses without re-triggering a full AI analysis
        const analytics = await getSurveyAnalytics(surveyId, undefined, 'restaurant', true)

        // 2. Extract Key Context
        const { metrics, staffRanking, generatedStrategies } = analytics

        let weaknesses = "General"
        if (generatedStrategies && generatedStrategies.length > 0) {
            weaknesses = generatedStrategies.map(s => s.problemDetected).join(". ")
        }

        const topStaff = staffRanking.length > 0 ? staffRanking[0].name : ''

        const model = getGeminiModel()

        const prompt = `
            Actúa como un Estratega de Marketing de Restaurantes de alto nivel.
            Tu misión es escribir 3 opciones de mensajes (Copy) altamente persuasivos para una campaña de ${platform === 'meta' ? 'Facebook/Instagram Ads' : 'WhatsApp Masivo'}.

            CONTEXTO DEL NEGOCIO:
            - Nombre: "${surveyTitle}" (Restaurante)
            - Calificación Actual: ${metrics.avgRating}/5
            - Debilidades Detectadas (Quejas): "${weaknesses}"
            - Staff Estrella: ${topStaff}

            SEGMENTO OBJETIVO: "${segment.toUpperCase()}"
            
            INSTRUCCIONES CLAVE POR SEGMENTO:
            
            1. Si el segmento es "ANGRY" (Insatisfechos/Detractores):
               - ESTRATEGIA: RECUPERACIÓN AGRESIVA CON EMPATÍA.
               - OBLIGATORIO: Reconoce implícitamente que fallamos en las áreas detectadas (${weaknesses}).
               - MENSAJE: "Te escuchamos y hemos cambiado".
               - LLAMADO A LA ACCIÓN: Invítalos a probar la "Nueva Experiencia" con un incentivo fuerte (descuento/regalo).
               - Ejemplo: "Lamentamos que tu última visita no fuera perfecta. Hemos mejorado [área débil]. Ven el martes y prueba..."

            2. Si el segmento es "HAPPY" (VIP/Satisfechos):
               - ESTRATEGIA: RECOMPENSA Y EXCLUSIVIDAD.
               - OBLIGATORIO: Hazlos sentir parte del 1%.
               - MENSAJE: "Eres nuestro favorito".
               - LLAMADO A LA ACCIÓN: Úsalos para traer amigos o probar platos nuevos antes que nadie.

            3. Si el segmento es "NEUTRAL":
               - ESTRATEGIA: CURIOSIDAD Y FOMO.
               - MENSAJE: "Nos extrañamos / Tienes que ver lo nuevo".

            FORMATO DE RESPUESTA:
            Devuelve SOLAMENTE un array JSON válido de strings.
            Ejemplo: ["Mensaje 1...", "Mensaje 2...", "Mensaje 3..."]
        `

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
        const messages = JSON.parse(cleanJson)

        return Array.isArray(messages) ? messages : ["Error generando mensajes."]

    } catch (error) {
        console.error('Error generating copy:', error)
        return [
            "¡Hola! Te extrañamos. Ven por un postre gratis hoy.",
            "Gracias por tu feedback. Hemos mejorado para ti.",
            "¡Oferta exclusiva! Muestra este mensaje para una sorpresa."
        ]
    }
}

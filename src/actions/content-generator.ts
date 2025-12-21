import { getGeminiModel } from '@/lib/gemini'

export async function generateCampaignCopy(
    segment: string,
    platform: 'meta' | 'whatsapp',
    surveyTitle: string
): Promise<string[]> {
    try {
        const model = getGeminiModel()

        const prompt = `
            Actúa como un experto Copywriter de Marketing Digital.
            Genera 3 opciones de mensajes cortos, persuasivos y efectivos para una campaña de ${platform === 'meta' ? 'Facebook/Instagram Ads' : 'WhatsApp Marketing'}.

            Contexto:
            - Negocio: Restaurante/Servicio (basado en la encuesta "${surveyTitle}")
            - Segmento de Audiencia: "${segment}" (ej. VIP, Insatisfechos, Neutrales)
            - Objetivo: ${segment.includes('VIP') || segment.includes('happy') ? 'Fidelizar, pedir reseña o venta cruzada' : segment.includes('angry') ? 'Recuperar cliente, ofrecer disculpa o incentivo' : 'Re-conectar, ofrecer promoción'}

            Formato de Respuesta:
            Devuelve SOLAMENTE un array JSON válido de strings, sin markdown, sin explicaciones extra.
            Ejemplo: ["Opción 1...", "Opción 2...", "Opción 3..."]
        `

        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Clean up markdown code blocks if present
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim()

        const messages = JSON.parse(cleanJson)

        if (Array.isArray(messages)) {
            return messages
        } else {
            return ["No se pudieron generar mensajes. Intenta de nuevo."]
        }

    } catch (error) {
        console.error('Error generating copy:', error)
        return [
            "¡Hola! Gracias por tu visita. Esperamos verte pronto.",
            "Tu opinión nos importa. ¿Cómo podemos mejorar?",
            "¡Tenemos una oferta especial para ti! Ven y descúbrela."
        ] // Fallbacks
    }
}

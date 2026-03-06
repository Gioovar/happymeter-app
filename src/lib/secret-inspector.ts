import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

/**
 * Validates a single survey response using AI to detect "Hidden Complaints"
 * e.g. High stars but negative text.
 */
export async function invokeSecretInspector(responseId: string, businessId: string) {
    if (!process.env.GEMINI_API_KEY) return;

    try {
        const responseData = await prisma.response.findUnique({
            where: { id: responseId },
            include: { answers: { include: { question: true } } }
        })

        if (!responseData) return;

        // Extract answers and text
        let totalScore = 0;
        let scorableQuestions = 0;
        let openComments = "";

        for (const ans of responseData.answers) {
            if (ans.question.type === 'starts' || ans.question.type === 'nps') {
                const val = Number(ans.value);
                if (!isNaN(val)) {
                    totalScore += val;
                    scorableQuestions++;
                }
            } else if (ans.question.type === 'text' && ans.value) {
                openComments += ans.value + " ";
            }
        }

        // If no text, nothing to semantically analyze
        if (!openComments.trim()) return;

        const avgScore = scorableQuestions > 0 ? (totalScore / scorableQuestions) : 0;
        // Adjust scale: NPS is 1-10, Stars is 1-5. Let's just pass raw data to Gemini.

        const SYSTEM_PROMPT = `
        Eres el "Inspector Secreto", una IA experta en analizar la satisfacción de clientes en restaurantes.
        Tu trabajo es detectar "Quejas Ocultas" (Hidden Complaints).
        Esto ocurre cuando un cliente deja una calificación decente o alta (ej. 4 o 5 estrellas), pero en sus comentarios menciona un problema operativo (ej. "Todo rico pero tardaron mucho", "El mesero fue grosero", "Había mucho ruido").

        DATOS DE LA ENCUESTA:
        Promedio de Calificación Numérica: ${avgScore.toFixed(1)}
        Comentarios Abiertos del Cliente: "${openComments}"

        INSTRUCCIONES:
        1. Analiza el sentimiento y la intención del comentario.
        2. Detecta si existe una QUEJA OCULTA (problemas de limpieza, alimentos, tiempo, ambiente, actitud).
        3. Si TODO está bien, devuelve {"hasHiddenComplaint": false}.
        4. Si detectas un problema real, devuelve {"hasHiddenComplaint": true, "category": "Categoría (Ej. Servicio Lento)", "severity": "Alta/Media/Baja", "summary": "Resumen corto de la falla"}
        
        Debes devolver SOLO JSON puro.
        `

        const model = getGeminiModel('gemini-2.5-flash', {
            generationConfig: { responseMimeType: "application/json" }
        })

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }]
        })

        const content = result.response.text()
        const evaluation = JSON.parse(content)

        if (evaluation.hasHiddenComplaint && evaluation.summary) {
            // Save as an internal alert/incident
            await prisma.issueTicket.create({
                data: {
                    businessId: businessId,
                    responseId: responseData.id,
                    customerName: responseData.customerName || "Anónimo",
                    customerPhone: responseData.customerPhone || null,
                    category: evaluation.category || "General",
                    urgency: evaluation.severity === "Alta" ? "CRITICAL" : "MEDIUM",
                    status: "OPEN",
                    aiContext: `Inspector IA: Detectada posible queja oculta. Resumen: ${evaluation.summary}. Comentario original: "${openComments}"`
                }
            })
        }

    } catch (error) {
        console.error('[SECRET_INSPECTOR_ERROR]', error)
    }
}

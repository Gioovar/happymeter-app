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
            const qType = (ans.question.type || '').toUpperCase();

            if (qType === 'STARS' || qType === 'RATING' || qType === 'NPS' || qType === 'EMOJI') {
                const val = Number(ans.value);
                if (!isNaN(val)) {
                    totalScore += val;
                    scorableQuestions++;
                }
            } else if (qType === 'TEXT' && ans.value) {
                openComments += ans.value + " ";
            }
        }

        // If no text, nothing to semantically analyze
        if (!openComments.trim()) return;

        const avgScore = scorableQuestions > 0 ? (totalScore / scorableQuestions) : 0;
        // Adjust scale: NPS is 1-10, Stars is 1-5. Let's just pass raw data to Gemini.

        const SYSTEM_PROMPT = `
        Eres el "Inspector de Calidad", una IA experta en analizar la satisfacción de clientes en restaurantes.
        Tu trabajo principal es interceptar QUEJAS CRÍTICAS y RIESGOS DE REPUTACIÓN antes de que lleguen a internet.

        DATOS DE LA ENCUESTA:
        Promedio de Calificación Numérica: ${avgScore.toFixed(1)}
        Comentarios Abiertos del Cliente: "${openComments}"

        INSTRUCCIONES:
        1. Analiza el sentimiento y la intención del comentario.
        2. Detecta si existe una QUEJA o PROBLEMA REAL (limpieza, calidad de alimentos, tiempos de espera, servicio al cliente, precios, instalaciones).
        3. No importa si la calificación es alta o baja; si el comentario menciona un problema operativo evidente, DEBES reportarlo.
        4. Si TODO está excelente o son comentarios sin relevancia operativa, devuelve {"hasComplaint": false}.
        5. Si detectas un problema, devuelve {"hasComplaint": true, "category": "Categoría (Ej. Servicio Lento o Comida)", "severity": "Alta/Media/Baja/Critica", "summary": "Resumen corto y directo de la falla"}
        
        Debes devolver SOLO JSON puro con la estructura indicada.
        `

        const model = getGeminiModel('gemini-2.5-flash', {
            generationConfig: { responseMimeType: "application/json" }
        })

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }]
        })

        const content = result.response.text()
        const evaluation = JSON.parse(content)

        if (evaluation.hasComplaint && evaluation.summary) {
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

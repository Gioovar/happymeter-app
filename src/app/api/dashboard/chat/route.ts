
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { messages, threadId, audio } = body
        const { userId } = await auth()

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // 1. Parallel Fetch of Context Data
        const now = new Date()
        const startOfWeek = new Date(now.setDate(now.getDate() - 7))

        const [userSettings, insights, aggregateStats, recentResponses] = await Promise.all([
            // Fetch User Settings
            prisma.userSettings.findUnique({
                where: { userId }
            }),
            // Fetch Long-Term Memory (AI Insights)
            prisma.aIInsight.findMany({
                where: { userId, isActive: true },
                select: { content: true }
            }),
            // Fetch Stats
            prisma.survey.findMany({
                where: { userId },
                include: {
                    _count: { select: { responses: true } },
                    responses: {
                        where: { createdAt: { gte: startOfWeek } },
                        select: { id: true }
                    }
                }
            }),
            // Fetch Recent Qualitative Feedback (Last 20 responses)
            prisma.response.findMany({
                where: {
                    survey: { userId }
                },
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    answers: {
                        include: {
                            question: {
                                select: { text: true, type: true }
                            }
                        }
                    }
                }
            })
        ])

        const businessName = (userSettings as any)?.businessName || "Tu Negocio"
        const industry = (userSettings as any)?.industry || "Comercio General"
        const insightText = insights.map(i => `- ${i.content}`).join('\n')

        const totalSurveys = aggregateStats.length
        const totalResponsesThisWeek = aggregateStats.reduce((acc, s) => acc + s.responses.length, 0)
        const totalResponsesAllTime = aggregateStats.reduce((acc, s) => acc + s._count.responses, 0)

        // Format Recent Feedback for AI
        const recentFeedbackText = recentResponses.map(r => {
            const date = new Date(r.createdAt).toLocaleDateString()
            const answersText = r.answers.map(a => {
                return `    * ${a.question.text}: "${a.value}"`
            }).join('\n')
            return `- [${date}]:\n${answersText}`
        }).join('\n\n')

        // 2. Prepare System Prompt with Memory
        let SYSTEM_PROMPT = `Actúa como el 'HappyMeter Analyst', experto en ${businessName} (${industry}).
        
        MEMORIA DE LARGO PLAZO:
        ${insightText || "No hay insights previos."}

        DATOS ESTADÍSTICOS:
        - Encuestas activas: ${totalSurveys}
        - Respuestas (Total histórico): ${totalResponsesAllTime}
        - Respuestas (Esta semana): ${totalResponsesThisWeek}
        
        FEEDBACK CUALITATIVO RECIENTE:
        ${recentFeedbackText || "No hay respuestas recientes."}
        
        TUS REGLAS DE ORO (ESTILO DE RESPUESTA):
        1. **SÉ CONCISO:** Ve al grano. Evita introducciones largas o saludos repetitivos como "Hola, soy tu analista".
        2. **MODO CONSULTIVO:** Si el usuario pide un consejo general (ej. "¿Dame una promoción?"), NO respondas con una lista genérica. Primero haz una **pregunta aclaratoria** para entender su necesidad real.
           - Ej. Usuario: "Quiero una promoción." -> Tú: "Claro, para darte la mejor opción, ¿qué día de la semana sientes que tienes menos rotación?"
        3. **BASADO EN DATOS:** Si das una recomendación, justifícala con los *Datos Estadísticos* o *Feedback Cualitativo* que tienes arriba.
        4. **FORMATO:** Usa viñetas y negritas para facilitar la lectura rápida.
        5. **GENERACIÓN DE REPORTES:** Si el usuario solicita explícitamente generar, descargar o ver el reporte (ej. "dame el reporte del mes", "genera el PDF"), responde ÚNICAMENTE con la etiqueta: [[ACTION:GENERATE_REPORT]]. No agregues más texto si ese es el único pedido.

        OBJETIVO PRINCIPAL: Ayudar a ${businessName} a crecer basándote en la realidad de sus datos y giro.
        `

        // 4. Save User Message to DB (if threadId provided)
        if (threadId) {
            const lastUserMsg = messages[messages.length - 1]
            await prisma.chatMessage.create({
                data: {
                    threadId,
                    role: 'user',
                    content: lastUserMsg.content
                }
            })
        }

        // Dry run
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[AI_CHAT] Missing GEMINI_API_KEY. Returning demo response.')
            return NextResponse.json({
                role: 'assistant',
                content: "Modo demo: No puedo conectar con mi cerebro principal (Falta API Key). Configúrala en Vercel.",
                newTitle: undefined
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

        // Inject Audio into the last user message
        if (audio && geminiHistory.length > 0) {
            const lastMsg = geminiHistory[geminiHistory.length - 1]
            if (lastMsg.role === 'user') {
                lastMsg.parts.push({
                    inlineData: {
                        mimeType: 'audio/webm',
                        data: audio
                    }
                })
            }
        }

        // Gemini restriction: First message must be 'user'. 
        const firstUserIndex = geminiHistory.findIndex((m: any) => m.role === 'user')
        if (firstUserIndex !== -1) {
            geminiHistory = geminiHistory.slice(firstUserIndex)
        }

        const result = await model.generateContent({
            contents: geminiHistory
        })

        const responseText = result.response.text()

        let newTitle = undefined

        // 5. Save Assistant Response and Generate Title
        if (threadId) {
            const lastUserMsg = messages[messages.length - 1]
            // Async learning (fire and forget)
            extractInsights(userId, threadId, lastUserMsg.content).catch(console.error)

            await prisma.chatMessage.create({
                data: {
                    threadId,
                    role: 'assistant',
                    content: responseText
                }
            })

            // Generate Title Logic (Self-Healing)
            // fetch current thread to see if it needs a title
            const currentThread = await prisma.chatThread.findUnique({
                where: { id: threadId },
                select: { title: true }
            })

            // Generate if it's new (short history) OR if it still has the default name
            if (currentThread?.title === "Nuevo Chat" || messages.length <= 2) {
                try {
                    const titleModel = getGeminiModel('gemini-1.5-flash', {
                        systemInstruction: `Genera un título muy corto, conciso y descriptivo (máximo 4 palabras) para un chat. Basado en este mensaje: "${lastUserMsg.content}". Ejemplo: "Estrategia de Ventas", "Análisis de Quejas". NO uses comillas ni puntos finales.`
                    })
                    const titleResult = await titleModel.generateContent(lastUserMsg.content)
                    const title = titleResult.response.text().trim()

                    if (title && title.length < 50) { // Safety check length
                        await prisma.chatThread.update({
                            where: { id: threadId },
                            data: { title }
                        })
                        newTitle = title
                    }
                } catch (e) {
                    console.error('[AI_CHAT_TITLE] Failed to generate title', e)
                }
            }
        }

        return NextResponse.json({ role: 'assistant', content: responseText, newTitle })

    } catch (error) {
        console.error('[AI_CHAT_POST]', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 })
    }
}

// Background function to extract insights
async function extractInsights(userId: string, threadId: string, lastUserMessage: string) {
    // Basic heuristic: check for phrases like "mi objetivo es", "quiero", "importante para mi"
    // In production, this would be a separate LLM call.
    const lower = lastUserMessage.toLowerCase()

    let newInsight = null
    if (lower.includes("mi objetivo es")) {
        newInsight = `Objetivo del usuario: "${lastUserMessage}"`
    } else if (lower.includes("preferimos")) {
        newInsight = `Preferencia de negocio: "${lastUserMessage}"`
    }

    if (newInsight) {
        await prisma.aIInsight.create({
            data: { userId, content: newInsight, source: threadId }
        })
        console.log(`[AI MEMORY] Learned new insight: ${newInsight}`)
    }
}

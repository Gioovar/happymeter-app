
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { messages, threadId } = await req.json()
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

        // 5. Save Assistant Response (if threadId)
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
        }

        return NextResponse.json({ role: 'assistant', content: responseText })

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

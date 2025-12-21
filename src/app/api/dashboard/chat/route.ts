
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

        const [userSettings, insights, aggregateStats] = await Promise.all([
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
            })
        ])

        const businessName = (userSettings as any)?.businessName || "Tu Negocio"
        const industry = (userSettings as any)?.industry || "Comercio General"
        const insightText = insights.map(i => `- ${i.content}`).join('\n')

        const totalSurveys = aggregateStats.length
        const totalResponsesThisWeek = aggregateStats.reduce((acc, s) => acc + s.responses.length, 0)
        const totalResponsesAllTime = aggregateStats.reduce((acc, s) => acc + s._count.responses, 0)

        // 2. Prepare System Prompt with Memory
        let SYSTEM_PROMPT = `Actúa como el 'HappyMeter Analyst', experto en ${businessName} (${industry}).
        
        MEMORIA DE LARGO PLAZO (Hechos que has aprendido sobre este negocio):
        ${insightText || "No hay insights previos."}

        DATOS ACTUALES:
        - Encuestas: ${totalSurveys}
        - Respuestas (Total): ${totalResponsesAllTime}
        - Respuestas (Semana): ${totalResponsesThisWeek}
        
        TUS CAPACIDADES:
        - Recuerda el contexto de la conversación actual.
        - Usa los insights para personalizar tus respuestas.
        - Si el usuario menciona un dato clave (ej. "Mi objetivo es X"), recuérdalo para el futuro.
        
        ... (Resto de instrucciones de análisis de datos) ...
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
            return NextResponse.json({ role: 'assistant', content: "Modo de prueba: Sin conexión a Gemini.", newTitle: undefined })
        }

        const model = getGeminiModel('gemini-1.5-flash', {
            systemInstruction: SYSTEM_PROMPT
        })

        // Map messages to Gemini Format
        const geminiHistory = messages.map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }))

        const result = await model.generateContent({
            contents: geminiHistory
        })

        const responseText = result.response.text() || "Sin respuesta."

        // 5. Save AI Response to DB
        let newTitle = undefined
        if (threadId) {
            await prisma.chatMessage.create({
                data: {
                    threadId,
                    role: 'assistant',
                    content: responseText
                }
            })

            // 6. Intelligent Renaming (If thread is new/untitled)
            // Check if we should rename (e.g. if it's the first exchange or title is default)
            const thread = await prisma.chatThread.findUnique({ where: { id: threadId } })
            if (thread && (thread.title === "Nuevo Chat" || thread.title === "Chat de Análisis")) {
                try {
                    console.log("[AI RENAMING] Attempting to rename thread:", threadId)
                    const titleModel = getGeminiModel('gemini-1.5-flash', {
                        systemInstruction: "Genera un título de 3 a 5 palabras que resuma este mensaje del usuario. NO uses comillas. Sé directo."
                    })

                    const titleResult = await titleModel.generateContent({
                        contents: [{ role: 'user', parts: [{ text: messages[messages.length - 1].content }] }]
                    })

                    const generatedTitle = titleResult.response.text()?.trim()

                    if (generatedTitle) {
                        console.log("[AI RENAMING] New title:", generatedTitle)
                        await prisma.chatThread.update({
                            where: { id: threadId },
                            data: { title: generatedTitle }
                        })
                        newTitle = generatedTitle
                    }
                } catch (e) {
                    console.error("[AI RENAMING ERROR]", e)
                }
            }

            // 7. ASYNC LEARNING
            extractInsights(userId, threadId, messages[messages.length - 1].content).catch(console.error)
        }

        return NextResponse.json({ role: 'assistant', content: responseText, newTitle })

    } catch (error) {
        console.error('[AI_CHAT_POST]', error)
        return new NextResponse(JSON.stringify({ error: "BSOD in Chat" }), { status: 500 })
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

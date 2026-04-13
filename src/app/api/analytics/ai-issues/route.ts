export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // Fetch ALL recent feedback to detect both issues and strengths
        const recentFeedback = await prisma.response.findMany({
            where: {
                survey: { userId },
                answers: { some: { value: { not: "" } } } // Get responses with answers
            },
            take: 50, // Increased sample size
            orderBy: { createdAt: 'desc' },
            include: {
                answers: { include: { question: true } },
                survey: { select: { title: true } }
            }
        })

        // Fetch Source Stats (Restored)
        const sourceSamples = await prisma.response.findMany({
            where: { survey: { userId }, customerSource: { not: null } },
            take: 100,
            select: { customerSource: true }
        })

        const sourceCounts: Record<string, number> = {}
        sourceSamples.forEach(s => {
            if (s.customerSource) {
                const k = s.customerSource.trim()
                sourceCounts[k] = (sourceCounts[k] || 0) + 1
            }
        })
        const topSources = Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => `${k} (${v})`)
            .join(', ') || "No hay datos suficientes de fuentes."

        if (recentFeedback.length === 0) {
            return NextResponse.json({ issues: [], strengths: [] })
        }

        // Optimize text for token limit - Include Question Text for Context
        const feedbackText = recentFeedback.map(r => {
            const formattedAnswers = r.answers
                .filter(a => a.question.type === 'TEXT' || a.question.type === 'RATING')
                .map(a => {
                    const qText = a.question.text
                    const answer = a.value
                    // Only include meaningful text or low ratings
                    if (a.question.type === 'TEXT' && answer.length > 2) return `P: ${qText} | R: "${answer}"`
                    if (a.question.type === 'RATING' && ['1', '2', '3'].includes(answer)) return `CALIFICACIÓN BAJA (${answer}/5): ${qText}`
                    if (a.question.type === 'RATING' && ['5'].includes(answer)) return `CALIFICACIÓN PERFECTA (5/5): ${qText}`
                    return null
                })
                .filter(Boolean)
                .join('; ')

            return formattedAnswers ? `- ${formattedAnswers}` : null
        }).filter(Boolean).join('\n')

        if (!feedbackText || feedbackText.length < 10) {
            return NextResponse.json({ issues: [] })
        }

        // Fetch user industry for context
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { industry: true, businessName: true }
        })
        const industry = userSettings?.industry || "Comercio General"
        const businessName = userSettings?.businessName || "El Negocio"

        // Fetch Issue Tickets for AI Context
        const userTickets = await prisma.issueTicket.findMany({
            where: { businessId: userId },
            select: { title: true, status: true, severity: true, id: true }
        })

        const openTickets = userTickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").map(t => `- [${t.id}] ${t.title} (${t.severity})`).join('\n') || "No hay tickets activos."
        const resolvedTickets = userTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").map(t => `- [${t.id}] ${t.title}`).join('\n') || "No hay tickets históricos resueltos."

        const SYSTEM_PROMPT = `
        Actúa como un experto Consultor de Negocios para la industria: ${industry.toUpperCase()}.
        Estás analizando el feedback de clientes de "${businessName}".

        TU OBJETIVO:
        1. Analiza las siguientes quejas/feedback e identifica problemas.
        2. Revisa el historial de tickets de la empresa. Si el problema ya existe como TICKET ACTIVO (OPEN/IN_PROGRESS), clasifícalo como recurrente e indica el ticketId.
        3. Si el problema de feedback coincide con un TICKET RESUELTO/HISTÓRICO, asume que ha regresado (regresión) y clasifícalo como un TICKET NUEVO (sin ticketId) pero menciónalo en el summary ("Volvieron quejas de...").
        4. Si el problema NO está en el historial, es un TICKET NUEVO (ticketId: null).
        5. Identifica las 2 Mayores Fortalezas (Lo que los clientes aman).
        
        Responde ESTRICTAMENTE en formato JSON:
        {
          "issues": [
            {
              "title": "Título Corto (max 4 palabras)",
              "severity": "HIGH" | "MEDIUM" | "LOW",
              "percentage": numero (estimado 0-100),
              "summary": "Explicación de 1 oración del problema",
              "recommendation": "Consejo accionable corto basado en un Caso de Éxito de la industria.",
              "ticketId": "IDE Exacto del ticket ACTIVO si este problema coincide (ej: clrz5...). null si es nuevo."
            }
          ],
          "strengths": [
             { 
               "title": "Título de Fortaleza",
               "summary": "Breve descripción de por qué los clientes valoran esto" 
             }
          ],
          "marketing_recommendation": {
             "title": "Oportunidad de Marketing",
             "strategy": "Consejo específico basado en el Top Source (max 15 palabras). Ej: 'Invierte más en Reels ya que Instagram es tu mayor fuente'.",
             "platform": "Nombre de la plataforma top (ej. Instagram)"
          }
        }

        IMPORTANTE: Todo el texto debe estar en ESPAÑOL.
        
        REGLAS DE TICKET INTELIGENTE (MEMORIA):
        Tienes acceso al registro de tickets de la empresa.
        - TICKETS ACTIVOS: 
        ${openTickets}
        - TICKETS RESUELTOS (HISTÓRICOS):
        ${resolvedTickets}
        
        REGLA CRÍTICA: NO reportes problemas que ya están en "TICKETS RESUELTOS" a menos que haya una queja excesiva y masiva RECIENTE que indique que el problema regresó. Si es una queja aislada antigua, ignórala por completo, asumiendo que el ticket lo resolvió.
        Prioriza alertar sobre TICKETS ACTIVOS si siguen apareciendo, o problemas COMPLETAMENTE NUEVOS.

        TOP FUENTES DE TRÁFICO (Donde nos conocen):
        ${topSources}
        
        LISTA DE FEEDBACK (Quejas/Opiniones Recientes):
        ${feedbackText}
        `


        // Dry run if no key
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY missing, returning mock data')
            return NextResponse.json({
                issues: [
                    { title: "Ejemplo: Comida Fría", severity: "HIGH", percentage: 45, summary: "Varios clientes mencionan comida fría.", recommendation: "Implementar KDS como McDonald's." },
                    { title: "Ejemplo: Ruido Alto", severity: "MEDIUM", percentage: 20, summary: "Música muy fuerte en la terraza.", recommendation: "Zonificación acústica como Hard Rock." }
                ],
                strengths: [
                    { title: "Ejemplo: Sabor Auténtico", summary: "Los clientes aman el sazón casero de los platillos." },
                    { title: "Ejemplo: Atención Rápida", summary: "Mencionan que los meseros son muy atentos y veloces." }
                ],
                marketing_recommendation: {
                    title: "Ejemplo: Oportunidad",
                    strategy: "Promocionar platillos estrella en Instagram.",
                    platform: "Instagram"
                }
            })
        }

        const model = getGeminiModel('gemini-flash-latest', {
            generationConfig: { responseMimeType: "application/json" }
        })

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }]
        })

        const content = result.response.text()
        if (!content) throw new Error("Empty AI response")

        const parsedResult = JSON.parse(content)
        return NextResponse.json(parsedResult)

    } catch (error) {
        console.error('[AI_ISSUES_POST]', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 })
    }
}



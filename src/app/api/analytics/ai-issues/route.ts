
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder',
})

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // Fetch negative feedback (Rating <= 3 OR Text responses)
        // We fetch a bit more to filter for text content
        const recentNegative = await prisma.response.findMany({
            where: {
                survey: { userId },
                answers: {
                    some: {
                        OR: [
                            { question: { type: 'RATING', }, value: { in: ['1', '2', '3'] } },
                            { question: { type: 'EMOJI', }, value: { in: ['1', '2', '3'] } },
                            // Also include text answers that might be negative even if rating is high?
                            // Safest is to rely on low ratings for "Issues".
                        ]
                    }
                }
            },
            take: 40,
            orderBy: { createdAt: 'desc' },
            include: {
                answers: { include: { question: true } },
                survey: { select: { title: true } }
            }
        })

        // Fetch Source Stats (Last 100 to get a good sample)
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

        if (recentNegative.length === 0) {
            return NextResponse.json({ issues: [] })
        }

        // Optimize text for token limit
        const feedbackText = recentNegative.map(r => {
            const comments = r.answers
                .filter(a => a.question.type === 'TEXT' && a.value.length > 3)
                .map(a => `"${a.value}"`)
                .join(', ')
            return comments ? `- ${comments}` : null
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

        const SYSTEM_PROMPT = `
        Actúa como un experto Consultor de Negocios para la industria: ${industry.toUpperCase()}.
        Estás analizando el feedback de clientes de "${businessName}".

        TU OBJETIVO:
        1. Analiza las siguientes quejas/feedback e identifica los Top 3 Problemas.
        2. Para cada problema, genera un "Caso de Éxito" REAL de una empresa famosa de la MISMA INDUSTRIA (${industry}).
           - Si es Restaurante: Usa McDonald's, Starbucks, Chipotle, El Bulli.
           - Si es Hotel: Usa Ritz-Carlton, Hilton, Airbnb.
           - Si es Bar/Nightclub: Usa Hakkasan, Coco Bongo, Speakeasy famosos.
           - Si es Retail: Usa Apple, Zara, Amazon.
        
        Responde ESTRICTAMENTE en formato JSON:
        {
          "issues": [
            {
              "title": "Título Corto (max 4 palabras)",
              "severity": "HIGH" | "MEDIUM" | "LOW",
              "percentage": numero (estimado 0-100),
              "summary": "Explicación de 1 oración del problema",
              "recommendation": "Consejo accionable corto (max 10 palabras) basado en el Caso de Éxito."
            }
          ],
          "marketing_recommendation": {
             "title": "Oportunidad de Marketing",
             "strategy": "Consejo específico basado en el Top Source (max 15 palabras). Ej: 'Invierte más en Reels ya que Instagram es tu mayor fuente'.",
             "platform": "Nombre de la plataforma top (ej. Instagram)"
          }
        }

        IMPORTANTE: Todo el texto debe estar en ESPAÑOL.
        
        TOP FUENTES DE TRÁFICO (Donde nos conocen):
        ${topSources}
        
        LISTA DE FEEDBACK (Quejas/Opiniones):
        ${feedbackText}
        `

        // Dry run if no key
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                issues: [
                    { title: "Ejemplo: Comida Fría", severity: "HIGH", percentage: 45, summary: "Varios clientes mencionan comida fría.", recommendation: "Implementar KDS como McDonald's." },
                    { title: "Ejemplo: Ruido Alto", severity: "MEDIUM", percentage: 20, summary: "Música muy fuerte en la terraza.", recommendation: "Zonificación acústica como Hard Rock." }
                ]
            })
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-5.2",
            messages: [{ role: "system", content: SYSTEM_PROMPT }],
            temperature: 0.5,
            response_format: { type: "json_object" }
        })

        const content = completion.choices[0].message.content
        if (!content) throw new Error("Empty AI response")

        const result = JSON.parse(content)
        return NextResponse.json(result)

    } catch (error) {
        console.error('[AI_ISSUES_POST]', error)
        return new NextResponse(JSON.stringify({ error: "Analysis failed" }), { status: 500 })
    }
}

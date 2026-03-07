import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        // 1. Fetch recent responses
        const recentResponses = await prisma.response.findMany({
            where: {
                survey: { userId },
                createdAt: { gte: thirtyDaysAgo }
            },
            include: {
                answers: { include: { question: true } },
                survey: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Fetch a larger batch, filter in JS
        })

        // Filter detractors (NPS <= 6 or Satisfaction <= 3) in memory
        const criticalResponses = recentResponses.filter((r: any) => {
            const hasBadNps = r.answers.some((a: any) =>
                a.question.type === 'NPS' && parseInt(a.value) <= 6
            )
            const hasBadRating = r.answers.some((a: any) =>
                a.question.type === 'RATING' && parseInt(a.value) <= 3
            )
            return hasBadNps || hasBadRating
        })

        if (criticalResponses.length === 0) {
            return NextResponse.json({
                success: true,
                hasCriticalMoments: false,
                criticalMoments: [],
                message: "No hay suficientes datos negativos recientes para detectar patrones de fricción."
            })
        }

        // 2. Format data for Gemini Context
        const formattedData = criticalResponses.map(r => {
            const date = new Date(r.createdAt)
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
            const dayOfWeek = days[date.getDay()]
            const hour = date.getHours()
            const timeOfDay = hour < 12 ? 'Mañana' : hour < 18 ? 'Tarde' : 'Noche'

            // Extract textual comments if any
            const comments = r.answers
                .filter((a: any) => a.question.type === 'TEXT' || a.question.type === 'LONG_TEXT')
                .map((a: any) => a.value)
                .join('. ')

            // Extract numeric rating for context
            const npsAns = r.answers.find((a: any) => a.question.type === 'NPS')
            const ratingAns = r.answers.find((a: any) => a.question.type === 'RATING')
            const score = npsAns ? npsAns.value : ratingAns ? ratingAns.value : 'N/A'

            return `Fecha: ${dayOfWeek} (${timeOfDay}, ${hour}:00), Rating/NPS: ${score}, Queja: ${comments || 'Sin texto'}`
        }).join('\n')

        // 3. Ask Gemini to cluster the complaints into "Critical Moments"
        const prompt = `
        Eres un analista de operaciones de restaurantes de clase mundial.
        A continuación tienes una lista de quejas recientes y malas calificaciones de clientes. Tu objetivo es encontrar "Patrones o Momentos Críticos".
        
        Busca si las quejas se agrupan en días específicos (ej. "Viernes por la noche") o por problemas recurrentes (ej. "Comida fría en los Lunes").
        
        Datos de quejas (Últimos 30 días):
        ${formattedData}
        
        Devuelve SOLO un JSON estrictamente estructurado así, sin markdown ni comillas invertidas, para que pueda ser parseado directamente.
        Si no hay un patrón claro, devuelve un array vacío en 'criticalMoments'. Trata de encontrar máximo 3 momentos críticos primordiales.
        
        {
          "hasCriticalMoments": true/false, // true si detectaste al menos 1 patrón muy claro
          "criticalMoments": [
            {
              "title": "Breve título de la advertencia (Ej. Cuello de botella los Jueves en la Tarde)",
              "dayOfWeek": "Ej. Jueves",
              "timeBlock": "Ej. 18:00 - 21:00",
              "recurringIssue": "Breve resumen de la queja principal que repiten",
              "impactLevel": "HIGH", // "HIGH", "MEDIUM", o "LOW"
              "suggestedAction": "Una sugerencia operativa asertiva de 1 oración (Ej. Reforzar el equipo de cocina los jueves o pre-preparar guarniciones)."
            }
          ]
        }
        `

        const model = getGeminiModel()
        const geminiResponse = await model.generateContent(prompt)
        const geminiResponseText = geminiResponse.response.text()

        // Clean markdown JSON formatting if present
        const cleanedText = geminiResponseText.replace(/```json\n/g, '').replace(/```\n/g, '').replace(/```/g, '').trim()

        let aiResult
        try {
            aiResult = JSON.parse(cleanedText)
        } catch (e) {
            console.error("Failed to parse Gemini JSON for Critical Moments:", cleanedText)
            return NextResponse.json({
                success: true,
                hasCriticalMoments: false,
                criticalMoments: [],
                message: "Error procesando el análisis de IA."
            })
        }

        return NextResponse.json({
            success: true,
            hasCriticalMoments: aiResult.hasCriticalMoments || false,
            criticalMoments: aiResult.criticalMoments || []
        })

    } catch (error: any) {
        console.error('[CRITICAL_MOMENTS_API]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

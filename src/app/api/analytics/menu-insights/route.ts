
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. Fetch text responses from the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentResponses = await prisma.response.findMany({
            where: {
                survey: { userId },
                createdAt: { gte: thirtyDaysAgo },
                answers: {
                    some: {
                        question: { type: { in: ['TEXT', 'LONG_TEXT'] } },
                        value: { not: '' }
                    }
                }
            },
            select: {
                answers: {
                    where: { value: { not: '' } }, // Fetch ALL answers
                    select: { value: true, question: { select: { type: true, text: true } } }
                }
            },
            take: 100
        })

        const texts = recentResponses
            .flatMap(r => r.answers.map(a => {
                // Determine if we should include this answer
                if (a.value.length < 3 || !isNaN(Number(a.value))) return null

                // If the question explicitly asks about food/drink, it's high value.
                // We'll pass the context to AI.
                return `Pregunta: "${a.question.text}" \nRespuesta: "${a.value}"`
            }))
            .filter(t => t !== null)
            .join("\n---\n")

        console.log('[MENU_AI_DEBUG] Analyzing texts:', texts)

        if (!texts || texts.length < 5) {
            return NextResponse.json({
                starDish: null,
                criticalDish: null,
                lovedItems: [],
                hatedItems: []
            })
        }

        const SYSTEM_PROMPT = `
        Eres un experto analista de menús y alimentos para restaurantes.
        Analiza los siguientes comentarios de clientes y extrae información sobre PLATILLOS y BEBIDAS.
        Ignora comentarios sobre servicio, ambiente o limpieza. Céntrate SOLO en comida y bebida.

        Tu Misión:
        1. Identifica el "Platillo Estrella" (El más elogiado).
        2. Identifica el "Platillo Crítico" (El más criticado). Sé sensible a críticas sutiles.
        3. Lista los 3 platillos más amados (incluyendo el estrella).
        4. Lista los 3 platillos más odiados (incluyendo el crítico).

        Responde en formato JSON:
        {
            "starDish": { "name": "Nombre del plato", "sentiment": 95, "mentions": 12, "reason": "Razón principal del éxito" },
            "criticalDish": { "name": "Nombre del plato", "sentiment": 15, "mentions": 8, "reason": "Razón de la queja (ej. salado, frío)" },
            "lovedItems": [ { "name": "Plato 1", "count": 10 }, ... ],
            "hatedItems": [ { "name": "Plato 1", "count": 5 }, ... ]
        }
        
        Si no hay suficientes datos para alguna categoría, usa null o array vacío.
        Sentiment es un puntaje de 0 a 100.
        `

        // Dry run handling
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY missing, returning mock data')
            return NextResponse.json({
                starDish: { name: "Hamburguesa Trufada", sentiment: 98, mentions: 15, reason: "Jugosa y sabor único" },
                criticalDish: { name: "Limonada", sentiment: 20, mentions: 6, reason: "Demasiado ácida" },
                lovedItems: [{ name: "Hamburguesa Trufada", count: 15 }, { name: "Papas Gajo", count: 12 }, { name: "Cheesecake", count: 8 }],
                hatedItems: [{ name: "Limonada", count: 6 }, { name: "Sopa del Día", count: 4 }]
            })
        }

        const model = getGeminiModel()
        const result = await model.generateContent({
            contents: [
                { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nCOMENTARIOS:\n${texts.substring(0, 30000)}` }] }
            ],
            generationConfig: {
                responseMimeType: "application/json",
            }
        })

        const content = result.response.text()
        if (!content) throw new Error("Empty AI response")

        return NextResponse.json(JSON.parse(content))

    } catch (error) {
        console.error('[MENU_INSIGHTS_ERROR]', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 })
    }
}

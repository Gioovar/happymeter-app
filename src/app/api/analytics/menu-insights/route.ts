
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

        // 1. Fetch text responses from the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const recentResponses = await prisma.response.findMany({
            where: {
                survey: { userId },
                createdAt: { gte: thirtyDaysAgo },
                answers: {
                    some: {
                        question: { type: 'TEXT' },
                        value: { not: '' }
                    }
                }
            },
            select: {
                answers: {
                    where: { question: { type: 'TEXT' } },
                    select: { value: true }
                }
            },
            take: 100 // Analyze last 100 text responses for speed/cost
        })

        const texts = recentResponses
            .flatMap(r => r.answers.map(a => a.value))
            .filter(t => t.length > 3) // Filter out very short meaningless answers
            .join("\n")

        if (!texts || texts.length < 20) {
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
        2. Identifica el "Platillo Crítico" (El más criticado).
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
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json({
                starDish: { name: "Hamburguesa Trufada", sentiment: 98, mentions: 15, reason: "Jugosa y sabor único" },
                criticalDish: { name: "Limonada", sentiment: 20, mentions: 6, reason: "Demasiado ácida" },
                lovedItems: [{ name: "Hamburguesa Trufada", count: 15 }, { name: "Papas Gajo", count: 12 }, { name: "Cheesecake", count: 8 }],
                hatedItems: [{ name: "Limonada", count: 6 }, { name: "Sopa del Día", count: 4 }]
            })
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `COMENTARIOS:\n${texts.substring(0, 15000)}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        })

        const content = completion.choices[0].message.content
        if (!content) throw new Error("Empty AI response")

        return NextResponse.json(JSON.parse(content))

    } catch (error) {
        console.error('[MENU_INSIGHTS_ERROR]', error)
        return new NextResponse(JSON.stringify({ error: "Failed to analyze menu" }), { status: 500 })
    }
}

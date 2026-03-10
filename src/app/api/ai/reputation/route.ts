import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'
import { getEffectiveUserId } from '@/lib/auth-context'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. Obtener BranchSlug (Tenant Isolation)
        const { searchParams } = new URL(req.url)
        const branchSlug = searchParams.get('branchSlug')

        // Determinar qué "userId" usar (Root o Miembro de Sucursal)
        const effectiveUserId = await getEffectiveUserId(branchSlug || undefined)

        if (!effectiveUserId) {
            return new NextResponse("Branch not found or unauthorized", { status: 403 })
        }

        // 2. Fetch de datos más recientes de reputación
        const latestReputation = await prisma.restaurantReputationScore.findFirst({
            where: {
                businessId: effectiveUserId
            },
            orderBy: {
                createdAt: 'desc' // Traer el escaneo más certero/reciente
            }
        })

        if (!latestReputation) {
            // Auto-Generate First Time using POST's logic silently to prevent empty heatmaps
            const result = await generateReputationLogic(effectiveUserId)
            if (result.error) {
                return NextResponse.json({ error: result.error, empty: true }, { status: 200 })
            }
            return NextResponse.json([result.data])
        }

        return NextResponse.json([latestReputation]) // Enviamos array para retro-compatibilidad del widget actual
    } catch (error) {
        console.error('[REPUTATION_GET_API_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. Obtener BranchSlug (Tenant Isolation)
        const body = await req.json().catch(() => ({}))
        const branchSlug = body.branchSlug

        // Determinar qué "userId" usar (Root o Miembro de Sucursal)
        const effectiveUserId = await getEffectiveUserId(branchSlug || undefined)

        if (!effectiveUserId) {
            return new NextResponse("Branch not found or unauthorized", { status: 403 })
        }

        const result = await generateReputationLogic(effectiveUserId)

        if (result.error) {
            return new NextResponse("Internal Server Error", { status: 500 })
        }

        return NextResponse.json(result.data)

    } catch (error: any) {
        console.error('[REPUTATION_API_POST_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

// Shared Logic to generate AI analysis to avoid duplication between POST and Auto-GET
async function generateReputationLogic(effectiveUserId: string) {
    try {
        // Find business info
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId: effectiveUserId },
            select: { industry: true, businessName: true }
        })

        const businessName = userSettings?.businessName || "El Negocio"

        // Fetch recent feedback (last 30 days) to calculate current reputation
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 30);

        const recentFeedback = await prisma.response.findMany({
            where: {
                survey: { userId: effectiveUserId },
                createdAt: { gte: recentDate }
            },
            take: 200,
            orderBy: { createdAt: 'desc' },
            include: {
                answers: { include: { question: true } }
            }
        })

        if (recentFeedback.length === 0) {
            return { error: "Not enough recent data to calculate reputation" }
        }

        // Extract textual and rating feedback to send to the AI
        let npsCount = 0; let npsSum = 0;
        const feedbackText = recentFeedback.map(r => {
            const lines = r.answers
                .filter(a => a.value.trim() !== '')
                .map(a => {
                    const type = a.question.type;
                    if (type === 'NPS' || type === 'RATING') {
                        const score = parseInt(a.value);
                        if (!isNaN(score)) {
                            npsCount++; npsSum += score;
                        }
                    }
                    if (type === 'TEXT' && a.value.length > 5) {
                        return `- Comentario cliente: "${a.value}"`
                    }
                    return null;
                })
                .filter(Boolean).join('\n')
            return lines || null
        }).filter(Boolean).join('\n')

        const SYSTEM_PROMPT = `
        Actúa como un experto en análisis de reputación de restaurantes.
        Evalúa el negocio "${businessName}" basado en los comentarios reales de clientes de los últimos 30 días.

        **TU TAREA:**
        Usa el análisis semántico de los comentarios (elogios y quejas) para determinar un puntaje del 1.0 al 5.0 (con un decimal) para cada una de estas categorías fundamentales:
        1. generalScore (El promedio o sensación general de satisfacción)
        2. serviceScore (Atención del personal, amabilidad)
        3. foodScore (Calidad de alimentos, sabor, temperatura)
        4. ambianceScore (Instalaciones, ruido, comodidad)
        5. cleanlinessScore (Limpieza de mesas, baños, platos)
        6. speedScore (Tiempos de espera, agilidad en la entrega)

        **METODOLOGÍA:**
        Si no hay menciones explícitas de una categoría (ej. nadie habla de la limpieza), asume una calificación "Base" ligada al puntaje general (ej. 4.5).
        Si hay quejas específicas ("la comida llegó fría"), penaliza seriamente esa categoría puntual.
        Si hay un comentario muy destructivo pero aislado, promédialo con los demás, no dejes que hunda toda la métrica.
        Analiza también la "trend" (tendencia): ¿está mejorando, empeorando o estable acorde a los comentarios? Responde con "Up", "Down" o "Stable".

        **COMENTARIOS DE CLIENTES RECIENTES:**
        ${feedbackText.substring(0, 3000)} // (Mostrando los más recientes)

        **RESPONDE EXCLUSIVAMENTE CON ESTE JSON STRICTO:**
        {
          "generalScore": 4.5,
          "serviceScore": 4.8,
          "foodScore": 4.2,
          "ambianceScore": 4.0,
          "cleanlinessScore": 5.0,
          "speedScore": 3.8,
          "trend": "Stable"
        }
        `

        let reputationData;

        // Si hay API KEY de Gemini, usamos IA. Si no, simulamos un resultado.
        if (process.env.GEMINI_API_KEY) {
            const model = getGeminiModel('gemini-2.5-flash', {
                generationConfig: { responseMimeType: "application/json" }
            })

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }]
            })

            const content = result.response.text()
            if (!content) throw new Error("Empty AI response")
            reputationData = JSON.parse(content)
        } else {
            console.warn("No GEMINI_API_KEY found. Generating mock reputation data.");
            reputationData = {
                generalScore: 4.6,
                serviceScore: 4.8,
                foodScore: 4.5,
                ambianceScore: 4.7,
                cleanlinessScore: 4.9,
                speedScore: 4.2,
                trend: "Up"
            }
        }

        // Save into DB
        const savedReputation = await prisma.restaurantReputationScore.create({
            data: {
                businessId: effectiveUserId,
                generalScore: parseFloat(reputationData.generalScore),
                serviceScore: parseFloat(reputationData.serviceScore),
                foodScore: parseFloat(reputationData.foodScore),
                ambianceScore: parseFloat(reputationData.ambianceScore),
                cleanlinessScore: parseFloat(reputationData.cleanlinessScore),
                speedScore: parseFloat(reputationData.speedScore),
                trend: reputationData.trend
            }
        })

        return { data: savedReputation }
    } catch (error: any) {
        console.error('[REPUTATION_API_ERROR]', error)
        return { error: "Internal Server Error" }
    }
}

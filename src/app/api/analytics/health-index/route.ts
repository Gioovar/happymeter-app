import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // Fetch User Info
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { industry: true, businessName: true }
        })
        const industry = userSettings?.industry || "restaurante"
        const businessName = userSettings?.businessName || "El Negocio"

        // 1. Customer Experience Data
        const recentFeedback = await prisma.response.findMany({
            where: {
                survey: { userId },
            },
            take: 100,
            orderBy: { createdAt: 'desc' },
            include: {
                answers: { include: { question: true } },
                survey: { select: { title: true, type: true } }
            }
        })

        // Simple Score Estimations for Prompt Context
        let promoters = 0; let detractors = 0; let totalRatings = 0;
        let positiveComments = 0; let negativeComments = 0;

        const feedbackText = recentFeedback.map(r => {
            const formattedAnswers = r.answers
                .filter(a => a.question.type === 'TEXT' || a.question.type === 'RATING' || a.question.type === 'NPS')
                .map(a => {
                    const qText = a.question.text
                    const answer = a.value

                    if (a.question.type === 'NPS') {
                        const score = parseInt(answer)
                        if (!isNaN(score)) {
                            totalRatings++;
                            if (score >= 9) promoters++;
                            else if (score <= 6) detractors++;
                        }
                    } else if (a.question.type === 'RATING') {
                        const score = parseInt(answer)
                        if (!isNaN(score)) {
                            totalRatings++;
                            if (score >= 4) promoters++;
                            else if (score <= 3) detractors++; // adjusting scale for simple 1-5
                        }
                    }

                    if (a.question.type === 'TEXT' && answer.length > 5) {
                        return `- Cliente opina: "${answer}"`
                    }
                    return null
                })
                .filter(Boolean)
                .join('\n')

            return formattedAnswers ? formattedAnswers : null
        }).filter(Boolean).join('\n')

        const estimatedNPS = totalRatings > 0 ? Math.round(((promoters - detractors) / totalRatings) * 100) : 0;

        // 2. Service Quality (Tickets)
        const recentTickets = await prisma.issueTicket.findMany({
            where: { businessId: userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: { title: true, status: true, isRecurring: true }
        })

        const activeTicketsCount = recentTickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length
        const resolvedTicketsCount = recentTickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length
        const ticketsDesc = recentTickets.map(t => `- [${t.status}] ${t.title} (Reincidente: ${t.isRecurring ? 'Sí' : 'No'})`).join('\n')

        // 3. Business Activity (Reservations)
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 30);

        const reservations = await prisma.reservation.findMany({
            where: {
                userId,
                createdAt: { gte: recentDate }
            },
            select: { status: true }
        })

        const totalReservations = reservations.length;
        const confirmedReservations = reservations.filter(r => r.status === "CONFIRMED" || r.status === "SEATED" || r.status === "COMPLETED").length;
        const cancelledReservations = reservations.filter(r => r.status === "CANCELLED" || r.status === "NO_SHOW").length;

        const SYSTEM_PROMPT = `
        Actúa como un Auditor de Operaciones y Analista de Negocios para la industria: ${industry}.
        Tu tarea es calcular el "Restaurant Health Index" (RHI) para "${businessName}", un score del 0 al 100 que evalúe la salud operativa general del negocio.

        **Criterios de Evaluación y Pesos:**
        1. **Experiencia del Cliente (40%):** Basado en comentarios y NPS.
        2. **Calidad del Servicio (20%):** Basado en quejas no resueltas (Tickets Activos) vs Resueltos.
        3. **Operación Interna (15%):** Penaliza si hay quejas recurrentes operativas marcadas en tickets. (Si no hay datos, asume un puntaje neutral de 75/100 para esta subcategoría).
        4. **Actividad del Negocio (15%):** Basado en volumen de reservas y ratio de cancelación/no-show.
        5. **Lealtad (10%):** Si hay alta recurrencia de clientes buenos (Si no hay métricas, asume neutral 75/100).

        **DATOS ACTUALES DEL NEGOCIO:**
        
        [EXPERIENCIA DEL CLIENTE]
        NPS Estimado (Promotores - Detractores): ${estimatedNPS > 0 ? '+' : ''}${estimatedNPS} (Basado en ${totalRatings} calificaciones)
        Comentarios Recientes:
        ${feedbackText.substring(0, 3000) /* Limiting size */}

        [PROBLEMAS Y TICKETS]
        Tickets Activos sin resolver: ${activeTicketsCount}
        Tickets Históricos Resueltos: ${resolvedTicketsCount}
        Detalle de problemas reportados:
        ${ticketsDesc}

        [ACTIVIDAD DEL NEGOCIO (Últimos 30 días)]
        Total Reservaciones: ${totalReservations}
        Confirmadas/Atendidas: ${confirmedReservations}
        Canceladas/No-Shows: ${cancelledReservations}

        **INSTRUCCIONES DE SALIDA:**
        Evalúa honesta y rigurosamente los datos. Genera un JSON estricto con esta estructura:
        {
          "score": 0 al 100,
          "status": "Excelente" | "Saludable" | "Atención necesaria" | "Problemas operativos" | "Crisis operativa",
          "customerExperienceScore": score de 0 a 100 para esta subcategoría (peso 40%),
          "serviceQualityScore": score de 0 a 100 (peso 20%),
          "internalOpsScore": score de 0 a 100 (peso 15%),
          "businessActivityScore": score de 0 a 100 (peso 15%),
          "loyaltyScore": score de 0 a 100 (peso 10%),
          "aiExplanation": "Explicación detallada pero concisa (máximo 3 párrafos) justificando el score general. Menciona las tendencias y problemas clave.",
          "aiRecommendations": [
            { "title": "Área de enfoque", "action": "Recomendación específica" },
            { "title": "Área de enfoque", "action": "Recomendación específica" }
          ]
        }
        `

        // Dry run if no key
        if (!process.env.GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY missing, returning mock health score')

            // Generate mock data and save it
            const mockData = {
                score: 82,
                status: "Saludable",
                customerExperienceScore: 85,
                serviceQualityScore: 78,
                internalOpsScore: 80,
                businessActivityScore: 90,
                loyaltyScore: 75,
                aiExplanation: "El negocio mantiene una buena tracción con reseñas positivas en su mayoría. Sin embargo, hay algunos cuellos de botella operativos relacionados con el tiempo de espera que han generado un par de tickets activos. La actividad de reservas es sólida.",
                aiRecommendations: [
                    { title: "Personal en Horas Pico", action: "Se recomienda evaluar el número de meseros durante el fin de semana para reducir tiempos de espera." },
                    { title: "Seguimiento de Tickets", action: "Revisar los problemas activos recurrentes para evitar que se conviertan en quejas sistemáticas." }
                ]
            }

            const mockHealthData = await prisma.restaurantHealthScore.create({
                data: {
                    businessId: userId,
                    score: mockData.score,
                    status: mockData.status,
                    customerExperienceScore: mockData.customerExperienceScore,
                    serviceQualityScore: mockData.serviceQualityScore,
                    internalOpsScore: mockData.internalOpsScore,
                    businessActivityScore: mockData.businessActivityScore,
                    loyaltyScore: mockData.loyaltyScore,
                    aiExplanation: mockData.aiExplanation,
                    aiRecommendations: mockData.aiRecommendations
                }
            })

            return NextResponse.json(mockHealthData)
        }

        const model = getGeminiModel('gemini-2.5-flash', {
            generationConfig: { responseMimeType: "application/json" }
        })

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }]
        })

        const content = result.response.text()
        if (!content) throw new Error("Empty AI response")

        const parsedResult = JSON.parse(content)

        // Save into Database
        const healthRecord = await prisma.restaurantHealthScore.create({
            data: {
                businessId: userId,
                score: parsedResult.score,
                status: parsedResult.status,
                customerExperienceScore: parsedResult.customerExperienceScore,
                serviceQualityScore: parsedResult.serviceQualityScore,
                internalOpsScore: parsedResult.internalOpsScore,
                businessActivityScore: parsedResult.businessActivityScore,
                loyaltyScore: parsedResult.loyaltyScore,
                aiExplanation: parsedResult.aiExplanation,
                aiRecommendations: parsedResult.aiRecommendations
            }
        })

        return NextResponse.json(healthRecord)

    } catch (error) {
        console.error('[HEALTH_INDEX_POST]', error)
        return new NextResponse("Internal API Error", { status: 500 })
    }
}

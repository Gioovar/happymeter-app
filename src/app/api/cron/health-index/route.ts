import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

// Force dynamic to ensure it runs every time the cron hits it
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // We only want to process businesses that are active and have had some activity recently.
        // For standard Vercel functions, we must respect the timeout.
        // We'll process up to 20 users with recent activity to prevent timeouts.
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 2); // Activity in last 48 hours

        const activeUsers = await prisma.userSettings.findMany({
            where: {
                isActive: true,
                // Simple heuristic: Only users who had a response recently
                surveys: {
                    some: {
                        responses: {
                            some: {
                                createdAt: { gte: recentDate }
                            }
                        }
                    }
                }
            },
            take: 20,
            select: { userId: true, industry: true, businessName: true }
        })

        if (activeUsers.length === 0) {
            return NextResponse.json({ message: "No active businesses to process today." })
        }

        const model = process.env.GEMINI_API_KEY
            ? getGeminiModel('gemini-2.5-flash', { generationConfig: { responseMimeType: "application/json" } })
            : null;

        const results = []

        for (const user of activeUsers) {
            const { userId, industry, businessName } = user
            const safeIndustry = industry || "restaurante"
            const safeName = businessName || "El Negocio"

            // 1. Customer Experience Data
            const recentFeedback = await prisma.response.findMany({
                where: { survey: { userId } },
                take: 100,
                orderBy: { createdAt: 'desc' },
                include: { answers: { include: { question: true } } }
            })

            let promoters = 0; let detractors = 0; let totalRatings = 0;

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
                                else if (score <= 3) detractors++;
                            }
                        }

                        if (a.question.type === 'TEXT' && answer.length > 5) return `- Cliente: "${answer}"`

                        return null
                    })
                    .filter(Boolean).join('\n')

                return formattedAnswers || null
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

            // 3. Business Activity
            const activityDate = new Date();
            activityDate.setDate(activityDate.getDate() - 30);

            const reservations = await prisma.reservation.findMany({
                where: { userId, createdAt: { gte: activityDate } },
                select: { status: true }
            })

            const totalReservations = reservations.length;
            const confirmedReservations = reservations.filter(r => r.status === "CONFIRMED" || r.status === "SEATED" || r.status === "COMPLETED").length;
            const cancelledReservations = reservations.filter(r => r.status === "CANCELLED" || r.status === "NO_SHOW").length;

            const SYSTEM_PROMPT = `
            Actúa como un Auditor de Operaciones para la industria: ${safeIndustry}.
            Calcula el "Restaurant Health Index" (RHI) para "${safeName}", un score del 0 al 100 evaluando la salud operativa.

            **Criterios y Pesos:**
            1. Experiencia del Cliente (40%): Basado en comentarios y NPS.
            2. Calidad del Servicio (20%): Basado en tickets (activos vs resueltos).
            3. Operación Interna (15%): Penaliza quejas recurrentes. Neutral 75/100 si no hay.
            4. Actividad del Negocio (15%): Reservas conf. vs canc.
            5. Lealtad (10%): Neutral 75/100 si no hay.

            **DATOS:**
            [EXPERIENCIA]
            NPS Estimado: ${estimatedNPS > 0 ? '+' : ''}${estimatedNPS} (${totalRatings} calificaciones)
            Feedback: ${feedbackText.substring(0, 1500)}

            [TICKETS]
            Activos: ${activeTicketsCount} | Resueltos: ${resolvedTicketsCount}
            Detalle: ${ticketsDesc}

            [ACTIVIDAD (30d)]
            Total: ${totalReservations} | Confirmadas: ${confirmedReservations} | Cancel/NoShow: ${cancelledReservations}

            RESPONDE SOLO EN JSON:
            {
              "score": 0-100,
              "status": "Excelente" | "Saludable" | "Atención necesaria" | "Problemas operativos" | "Crisis operativa",
              "customerExperienceScore": 0-100,
              "serviceQualityScore": 0-100,
              "internalOpsScore": 0-100,
              "businessActivityScore": 0-100,
              "loyaltyScore": 0-100,
              "aiExplanation": "1-2 párrafos justificando.",
              "aiRecommendations": [ { "title": "Área", "action": "Recomendación" } ]
            }
            `

            try {
                if (model) {
                    const result = await model.generateContent({
                        contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }]
                    })
                    const content = result.response.text()
                    if (content) {
                        const parsedResult = JSON.parse(content)
                        await prisma.restaurantHealthScore.create({
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
                        results.push({ userId, status: 'success', score: parsedResult.score })
                    }
                }
            } catch (err: any) {
                console.error(`Failed RHI for user ${userId}:`, err?.message)
                results.push({ userId, status: 'error', error: err?.message })
            }
        }

        return NextResponse.json({ processed: results.length, details: results })

    } catch (error) {
        console.error('[CRON_HEALTH_INDEX]', error)
        return new NextResponse("Internal API Error", { status: 500 })
    }
}

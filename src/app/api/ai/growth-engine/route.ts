import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // Find business info
        const userSettings = await prisma.userSettings.findUnique({
            where: { userId },
            select: { industry: true, businessName: true }
        })

        const businessName = userSettings?.businessName || "El Negocio"
        const industry = userSettings?.industry || "restaurante"

        // Step 1: Gather Anomalies/Data Points
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

        // 1. Inactive Loyal Customers Detection (Using Phone Numbers from Responses)
        const recentResponses = await prisma.response.findMany({
            where: { survey: { userId }, createdAt: { gte: thirtyDaysAgo } },
            select: { customerPhone: true }
        })
        const pastResponses = await prisma.response.findMany({
            where: { survey: { userId }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
            select: { customerPhone: true }
        })

        const recentPhones = new Set(recentResponses.map(r => r.customerPhone).filter(Boolean))
        const pastPhones = new Set(pastResponses.map(r => r.customerPhone).filter(Boolean))

        // Find users who visited month 2 but not month 1 (At risk of churn)
        let inactiveLoyalCount = 0;
        for (const phone of pastPhones) {
            if (!recentPhones.has(phone)) inactiveLoyalCount++;
        }

        // 2. Reservation Trends
        const recentReservations = await prisma.reservation.count({
            where: { userId, createdAt: { gte: thirtyDaysAgo } }
        })
        const pastReservations = await prisma.reservation.count({
            where: { userId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }
        })

        const resTrend = pastReservations === 0 ? "Neutral" :
            recentReservations < (pastReservations * 0.8) ? "Drop" : "Stable";

        // 3. Current unresolved tickets
        const activeTicketsCount = await prisma.issueTicket.count({
            where: { businessId: userId, status: { in: ["OPEN", "IN_PROGRESS"] } }
        })

        // 4. Load Dynamic Memory (Resolved Issues)
        const resolvedIssues = await prisma.resolvedIssue.findMany({
            where: { businessId: userId, status: "RESOLVED" },
            select: { issueSummary: true }
        })
        const resolvedListText = resolvedIssues.length > 0
            ? resolvedIssues.map(i => `- ${i.issueSummary}`).join('\n')
            : "No hay incidentes previos marcados como solucionados.";

        const SYSTEM_PROMPT = `
        Eres el "Motor de Crecimiento" (Growth Engine) de un software de inteligencia de negocios para restaurantes.
        Tu misión es analizar la data cruda del negocio "${businessName}" (${industry}) y detectar oportunidades específicas de mejora o retención.

        DATOS RECIENTES DETECTADOS:
        - Clientes inactivos detectados (visitaron el mes pasado pero este no): ${inactiveLoyalCount} cuentas de riesgo.
        - Tendencia de reservaciones vs el mes anterior: ${resTrend} (Recientes: ${recentReservations}, Pasadas: ${pastReservations}).
        - Tickets/Problemas Operativos Abiertos: ${activeTicketsCount}.

        MEMORIA DINÁMICA (IGNORAR ESTOS PROBLEMAS YA SOLUCIONADOS):
        El gerente ya solucionó los siguientes problemas en el pasado. Bajo ninguna circunstancia los vuelvas a reportar como anomalías:
        ${resolvedListText}

        INSTRUCCIONES:
        Genera entre 1 y 3 "Oportunidades de Crecimiento" u "Incidentes" claros para el gerente. 
        Si el negocio tiene clientes inactivos, sugiéreles una campaña de reactivación.
        Si las reservaciones cayeron, sugiere empujar los días lentos.
        Si hay muchos tickets, sugiere enfocarse en operaciones.
        NO reportes los problemas listados en la 'Memoria Dinámica'.
        
        Devuelve SOLO UN JSON ARRAY con esta estructura estricta:
        [
          {
            "title": "Reactiva a tus clientes en riesgo (Ejemplo)",
            "description": "Se han detectado 15 clientes que venían regularmente y no han vuelto este mes. Es un buen momento para traerlos de vuelta con una cortesía.",
            "type": "Retention" // Options: "Retention", "Acquisition", "Operations", "Loyalty"
          }
        ]
        `

        let opportunities = [];

        if (process.env.GEMINI_API_KEY) {
            const model = getGeminiModel('gemini-2.5-flash', {
                generationConfig: { responseMimeType: "application/json" }
            })

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }]
            })

            const content = result.response.text()
            if (!content) throw new Error("Empty AI response")
            opportunities = JSON.parse(content)
        } else {
            console.warn("No GEMINI_API_KEY found. Generating mock opportunities.");
            opportunities = [
                {
                    title: `Reactivar ${inactiveLoyalCount || 10} Clientes en Riesgo`,
                    description: "Hemos detectado clientes que nos visitaron el mes pasado pero han estado inactivos recientemente. Te sugerimos crear una campaña de reactivación.",
                    type: "Retention"
                },
                {
                    title: "Impulsar Reservaciones entre semana",
                    description: "Tus reservaciones han visto una ligera caída del 20% vs el mes anterior. Una promoción de 'Martes de Amigos' podría ayudar.",
                    type: "Acquisition"
                }
            ]
        }

        // Save into DB
        // Clear all previous NEW opportunities first, so we don't duplicate logic. (A robust system might check for uniqueness instead).
        await prisma.aIGrowthOpportunity.deleteMany({
            where: { businessId: userId, status: "NEW" }
        })

        const savedOps = await Promise.all(opportunities.map(async (op: any) => {
            return await prisma.aIGrowthOpportunity.create({
                data: {
                    businessId: userId,
                    title: op.title,
                    description: op.description,
                    type: op.type,
                    status: "NEW"
                }
            })
        }))

        return NextResponse.json(savedOps)

    } catch (error: any) {
        console.error('[GROWTH_ENGINE_API_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

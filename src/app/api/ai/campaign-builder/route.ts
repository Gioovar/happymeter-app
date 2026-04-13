export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { getGeminiModel } from '@/lib/gemini'

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const body = await req.json()
        const { opportunityId } = body

        if (!opportunityId) {
            return new NextResponse("Opportunity ID is required", { status: 400 })
        }

        // Validate opportunity belongs to this user
        const opportunity = await prisma.aIGrowthOpportunity.findUnique({
            where: { id: opportunityId },
            include: { user: { select: { businessName: true, industry: true } } }
        })

        if (!opportunity || opportunity.businessId !== userId) {
            return new NextResponse("Opportunity not found", { status: 404 })
        }

        const businessName = opportunity.user?.businessName || "El Negocio"
        const industry = opportunity.user?.industry || "restaurante"

        const SYSTEM_PROMPT = `
        Eres un Director de Marketing experto para negocios de la industria: ${industry}.
        Tu cliente es "${businessName}".
        
        El Motor de Crecimiento del negocio ha detectado la siguiente OPORTUNIDAD URGENTE:
        Título: ${opportunity.title}
        Descripción detallada: ${opportunity.description}
        Tipo de Estrategia: ${opportunity.type}

        **TU TAREA:**
        Diseña una "Campaña de Marketing Automatizada" directamente atacando esta oportunidad.
        La campaña debe ser realista, atractiva y diseñada para enviar a los clientes a través del canal más efectivo (Push Notification, Email o In-App).

        Genera un JSON ESTRICTO con la siguiente estructura y datos:
        {
          "name": "Nombre atractivo de la campaña (ej. Regreso Triunfal)",
          "objective": "Qué vamos a lograr puntualmente en una línea",
          "targetAudience": "A quién se la enviamos (ej. Clientes inactivos por 30 días)",
          "promotionalMessage": "El texto persuasivo exacto que recibirá el cliente. Sé cálido, invítalos a volver e incluye un gancho (ej. postre gratis).",
          "recommendedChannel": "Push", // Email, Push, In-App
        }
        `

        let campaignData;

        if (process.env.GEMINI_API_KEY) {
            const model = getGeminiModel('gemini-2.5-flash', {
                generationConfig: { responseMimeType: "application/json" }
            })

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }]
            })

            const content = result.response.text()
            if (!content) throw new Error("Empty AI response")
            campaignData = JSON.parse(content)
        } else {
            console.warn("No GEMINI_API_KEY found. Generating mock campaign.");
            campaignData = {
                name: "¡Te extrañamos en " + businessName + "!",
                objective: "Reactivar clientes que no han visitado en 30 días",
                targetAudience: "Clientes Inactivos (Mes anterior)",
                promotionalMessage: "Ha pasado tiempo desde que nos visitaste. Vuelve esta semana, muestra este mensaje y recibe una bebida de cortesía en la compra de tu platillo favorito.",
                recommendedChannel: "Push"
            }
        }

        // Save into DB 
        const newCampaign = await prisma.aIMarketingCampaign.create({
            data: {
                businessId: userId,
                opportunityId: opportunity.id,
                name: campaignData.name,
                objective: campaignData.objective,
                targetAudience: campaignData.targetAudience,
                promotionalMessage: campaignData.promotionalMessage,
                recommendedChannel: campaignData.recommendedChannel,
                status: "DRAFT" // Manager needs to approve it later
            }
        })

        // Optionally, update the opportunity status to ACTIONED so it doesn't prompt again
        await prisma.aIGrowthOpportunity.update({
            where: { id: opportunity.id },
            data: { status: "ACTIONED" }
        })

        return NextResponse.json(newCampaign)

    } catch (error: any) {
        console.error('[CAMPAIGN_BUILDER_API_ERROR]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

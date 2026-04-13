export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getGeminiModel } from '@/lib/gemini'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // 1. Fetch real predictive occupancy
        const occupancyRes = await fetch(`${baseUrl}/api/ai/occupancy-prediction`, {
            headers: {
                Cookie: req.headers.get('cookie') || ''
            }
        })

        if (!occupancyRes.ok) {
            console.error('[AUTOPILOT_API] Failed to fetch occupancy prediction')
            return new NextResponse("Failed to fetch occupancy", { status: 500 })
        }

        const occupancyData = await occupancyRes.json()
        const fullDayForecast = occupancyData.fullDay || []

        // 2. Identify the slowest hour of the day (must be future or current)
        const currentHourStr = `${new Date().getHours().toString().padStart(2, '0')}:00`
        const upcomingHours = fullDayForecast.filter((f: any) => f.hour >= currentHourStr)

        if (upcomingHours.length === 0) {
            return NextResponse.json({
                success: true,
                requiresAction: false,
                message: "No quedan horas operativas hoy para evaluar campañas de autopiloto."
            })
        }

        const slowestBlock = upcomingHours.reduce((prev: any, current: any) => {
            return (prev.occupancyPercentage < current.occupancyPercentage) ? prev : current
        })

        // TRIGGER CONDITION: Under 40% occupancy predicted
        const triggerConditionsMet = slowestBlock.occupancyPercentage < 40

        if (!triggerConditionsMet) {
            return NextResponse.json({
                success: true,
                requiresAction: false,
                message: "No se requiere autopilot. La ocupación proyectada es saludable (mayor al 40%)."
            })
        }

        // 3. AI Copilot: Generate the Campaign Proposal based on the data
        const prompt = `
            Actúa como el Director de Marketing Automático de un restaurante.
            Hemos detectado un pronóstico crítico de baja afluencia para HOY a las ${slowestBlock.hour}. 
            La ocupación proyectada alarmantemente es del ${slowestBlock.occupancyPercentage}%.

            Redacta TRES variables concisas para una alerta de Flash Sale:
            1. Un título magnético y urgente (max 5 palabras).
            2. Una descripción persuasiva que le proponga al dueño del restaurante lanzar una promoción agresiva de 2x1 o postre gratis sólo durante esa hora para salvar las ventas. (1 párrafo).
            3. Un estimado de alcance lógico en formato texto (ej. '1,200 clientes en radar').
            4. Un rango de retorno de inversión esperado (ej. '$2,000 - $5,000 MXN').

            Responde ÚNICAMENTE en este formato JSON válido, sin Markdown ni comillas triples:
            {
                "title": "titulo",
                "description": "descripcion",
                "estimatedReach": "alcance",
                "projectedRoi": "roi"
            }
        `

        const model = getGeminiModel()
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Parse Gemini JSON safely
        let aiProposal;
        try {
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            aiProposal = JSON.parse(cleanJson)
        } catch (e) {
            console.error("Gemini failed to generate valid JSON:", responseText)
            aiProposal = {
                title: `Alerta: Tráfico Lento a las ${slowestBlock.hour}`,
                description: `El sistema predictivo detectó una fuerte caída de afluencia para las ${slowestBlock.hour} (${slowestBlock.occupancyPercentage}%). ¿Deseas enviar a tu base de clientes un 2x1 válido solo en ese horario?`,
                estimatedReach: 'Todos los clientes',
                projectedRoi: '$2,000 - $5,000 MXN'
            }
        }

        // 4. Return the Autopilot Campaign Proposal
        const campaignProposal = {
            id: `auto-flash-sale-${Date.now()}`,
            type: 'FLASH_SALE',
            urgencyLevel: 'HIGH',
            title: aiProposal.title,
            description: aiProposal.description,
            targetSegment: 'Todos los clientes registrados en Loyalty',
            estimatedReach: aiProposal.estimatedReach,
            projectedRoi: aiProposal.projectedRoi,
            status: 'PENDING_APPROVAL'
        }

        return NextResponse.json({
            success: true,
            requiresAction: true,
            proposal: campaignProposal
        })

    } catch (error: any) {
        console.error('[AUTOPILOT_API]', error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

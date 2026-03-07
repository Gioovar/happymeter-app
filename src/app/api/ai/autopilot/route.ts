import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: Request) {
    try {
        const { userId } = await auth()
        if (!userId) return new NextResponse("Unauthorized", { status: 401 })

        // 1. In a real scenario, this would check the OccupancyRadar data
        // For now, we simulate the logic: 
        // If the AI model predicts < 30% occupancy for the upcoming week's slowest shift, 
        // propose a Flash Sale campaign.

        // Simulated predictive insight
        const predictedSlowestDay = {
            day: 'Martes',
            time: '18:00 - 20:00',
            projectedOccupancy: 22 // %
        }

        const triggerConditionsMet = predictedSlowestDay.projectedOccupancy < 40

        if (!triggerConditionsMet) {
            return NextResponse.json({
                success: true,
                requiresAction: false,
                message: "No se requiere autopilot. La ocupación proyectada es saludable."
            })
        }

        // 2. Generate the Autopilot Campaign Proposal
        const campaignProposal = {
            id: 'auto-flash-sale-01',
            type: 'FLASH_SALE',
            urgencyLevel: 'HIGH',
            title: `Oferta Flash: ${predictedSlowestDay.day} salvaje`,
            description: `El sistema predictivo detectó una fuerte caída de afluencia para este ${predictedSlowestDay.day} de ${predictedSlowestDay.time}. ¿Deseas enviar a tu base de clientes un 2x1 en Mixología válido solo en ese horario?`,
            targetSegment: 'Todos los clientes registrados en Loyalty',
            estimatedReach: '1,450 clientes',
            projectedRoi: '$4,500 - $8,000 MXN',
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

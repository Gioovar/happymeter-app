import { getProgramFloorPlan } from "@/actions/reservations"
import { CustomerReservationCanvas } from "@/components/reservations/CustomerReservationCanvas"
import { notFound } from "next/navigation"

export default async function ReservationPage({ params }: { params: { programId: string } }) {
    const { programId } = params
    const result = await getProgramFloorPlan(programId)

    if (!result.success || !result.floorPlan) {
        return notFound()
    }

    return (
        <main className="min-h-screen bg-black text-white">
            <CustomerReservationCanvas
                floorPlan={result.floorPlan}
                businessName={result.businessName || "Reservación"}
                programId={programId}
            />
        </main>
    )
}

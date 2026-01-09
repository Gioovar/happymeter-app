import { getProgramFloorPlan } from "@/actions/reservations"
import { CustomerReservationCanvas } from "@/components/reservations/CustomerReservationCanvas"
import { notFound } from "next/navigation"

import { currentUser } from "@clerk/nextjs/server"

export default async function ReservationPage({ params }: { params: { programId: string } }) {
    const { programId } = params
    const result = await getProgramFloorPlan(programId)
    const user = await currentUser()

    if (!result.success || !result.floorPlans || result.floorPlans.length === 0) {
        return notFound()
    }

    const userData = user ? {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.emailAddresses[0]?.emailAddress,
        phone: user.phoneNumbers[0]?.phoneNumber
    } : undefined

    // Default to first floor for compatibility if needed, but passing all is better
    return (
        <main className="min-h-screen bg-black text-white">
            <CustomerReservationCanvas
                floorPlans={result.floorPlans} // Passing ALL floors
                businessName={result.businessName || "Reservación"}
                programId={programId}
                currentUser={userData}
            />
        </main>
    )
}

import dynamic from "next/dynamic"
import { getProgramFloorPlan } from "@/actions/reservations"
import { notFound } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"

const CustomerReservationCanvas = dynamic(
    () => import("@/components/reservations/CustomerReservationCanvas").then(mod => mod.CustomerReservationCanvas),
    {
        ssr: false,
        loading: () => <div className="text-white">Cargando mapa...</div>
    }
)

export default async function ReservationPage({ params }: { params: { programId: string } }) {
    const { programId } = params
    console.log(`[ReservationPage] accessing programId: ${programId}`)

    // Safe User Fetch
    let user = null
    try {
        user = await currentUser()
    } catch (e) {
        console.error("[ReservationPage] currentUser() failed", e)
    }

    const result = await getProgramFloorPlan(programId)
    console.log(`[ReservationPage] floorPlan result:`, result.success)

    // Validate result structure before render
    if (!result?.success || !result?.floorPlans || result.floorPlans.length === 0) {
        console.warn("[ReservationPage] NotFound triggered")
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

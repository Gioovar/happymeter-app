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

export default async function ReservationPage({
    params,
    searchParams
}: {
    params: { programId: string }
    searchParams: { [key: string]: string | string[] | undefined }
}) {
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

    // Helper to get string from searchParam
    const getParam = (key: string) => {
        const val = searchParams[key]
        if (Array.isArray(val)) return val[0]
        return val || ''
    }

    const userData = {
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : getParam('name'),
        email: user ? user.emailAddresses[0]?.emailAddress : getParam('email'),
        phone: user ? user.phoneNumbers[0]?.phoneNumber : getParam('phone')
    }

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

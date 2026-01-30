import dynamic from "next/dynamic"
import { getProgramFloorPlan } from "@/actions/reservations"
import { notFound } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { CalendarClock, Store } from "lucide-react"

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

    // Safe User Fetch
    let user = null
    try {
        user = await currentUser()
    } catch (e) {
        console.error("[ReservationPage] currentUser() failed", e)
    }

    const result = await getProgramFloorPlan(programId)

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

    // Handle Empty Config: "Coming Soon" View
    if (!result?.success || !result?.floorPlans || result.floorPlans.length === 0) {
        // Render Coming Soon instead of NotFound
        return (
            <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 p-8 rounded-full mb-6 ring-1 ring-white/10 shadow-2xl shadow-violet-500/20">
                    <CalendarClock className="w-16 h-16 text-violet-400" />
                </div>

                <h1 className="text-3xl font-bold mb-2 tracking-tight">
                    {result?.businessName || "Reservaciones"}
                </h1>

                <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
                    <span className="text-xs font-bold text-violet-300 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                        Próximamente
                    </span>
                </div>

                <p className="max-w-md text-gray-400 text-lg leading-relaxed mb-10">
                    Estamos configurando nuestro sistema de reservas digitales para brindarte una mejor experiencia.
                </p>

                <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Store className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-white">Visítanos pronto</h3>
                            <p className="text-xs text-gray-500">Te avisaremos cuando esté listo</p>
                        </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[60%] bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full" />
                    </div>
                </div>
            </main>
        )
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

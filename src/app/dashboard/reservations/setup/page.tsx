import { getFloorPlans } from "@/actions/reservations"
import CanvasEditor from "@/components/reservations/CanvasEditor"
import ReservationSettings from "@/components/reservations/ReservationSettings"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ReservationSetupPage() {
    const floorPlans = await getFloorPlans()
    // Dynamic import to avoid circular dep issues in server components if any (though usually safe)
    const { getReservationSettings } = await import("@/actions/reservations")
    const settings = await getReservationSettings()

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col overflow-y-auto pb-20">
            <div className="flex items-center gap-4 mb-4 shrink-0 px-1 pt-1">
                <Link
                    href="/dashboard/reservations"
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white">Configuración de Reservas</h1>
                    <p className="text-sm text-slate-400">Personaliza la experiencia de reservación</p>
                </div>
            </div>

            <div className="max-w-4xl w-full mx-auto space-y-8">
                {/* 1. General Settings */}
                <ReservationSettings initialSettings={settings} />

                {/* 2. Map Editor (Only if NOT simple mode, OR show it but maybe disabled? User said "if invalid map, simple reservation". 
                   Actually user said "if client wishes, they have simple module... but if no map, take reservation freely".
                   So we can keep Map Editor available always, but Simple Mode bypasses it in public view.
                */}
                {!settings.simpleMode && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white">Distribución de Mesas</h2>
                                <p className="text-sm text-gray-500">Dibuja tu plano para la selección de mesas</p>
                            </div>
                        </div>
                        <div className="h-[600px] border border-white/10 rounded-2xl overflow-hidden bg-black/50">
                            <CanvasEditor initialData={floorPlans} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

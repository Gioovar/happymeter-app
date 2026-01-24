import { getFloorPlans } from "@/actions/reservations"
import CanvasEditor from "@/components/reservations/CanvasEditor"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function ReservationSetupPage() {
    const floorPlans = await getFloorPlans()

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center gap-4 mb-4 shrink-0">
                <Link
                    href="/dashboard/reservations"
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white">Configuración del Plano</h1>
                    <p className="text-sm text-slate-400">Diseña la distribución de tu establecimiento</p>
                </div>
            </div>

            <CanvasEditor initialData={floorPlans} />
        </div>
    )
}

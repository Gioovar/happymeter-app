
import { getDashboardContext } from "@/lib/auth-context"
import { redirect } from "next/navigation"
import { getProcessZone } from "@/actions/processes"
import { AlertCircle } from "lucide-react"
import ProcessZoneView from "@/components/processes/ProcessZoneView"

export default async function ProcessZonePage({ params }: { params: { branchSlug: string, zoneId: string } }) {
    const context = await getDashboardContext(params.branchSlug);
    if (!context || !context.userId) return redirect('/dashboard');

    const zone = await getProcessZone(params.zoneId)

    if (!zone) {
        return (
            <div className="h-[50vh] flex flex-col items-center justify-center text-center text-gray-400">
                <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-white">Zona no encontrada</h2>
                <p>El flujo que buscas no existe o no tienes acceso.</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <ProcessZoneView zone={zone} branchSlug={params.branchSlug} />
        </div>
    )
}

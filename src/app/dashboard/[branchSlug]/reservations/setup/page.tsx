
import { getDashboardContext } from "@/lib/auth-context"
import { redirect } from "next/navigation"
import { getFloorPlans } from "@/actions/reservations"
import CanvasEditor from "@/components/reservations/CanvasEditor"
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ReservationSetupPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context || !context.userId) return redirect('/dashboard')

    const userId = context.userId
    const branchSlug = params.branchSlug

    // Fetch existing floor plans
    const floorPlans = await getFloorPlans(userId)

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col">
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a]">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/dashboard/${branchSlug}/reservations`}
                        className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-white">Editor de Espacios</h1>
                        <p className="text-xs text-zinc-400">Configura la distribución de tus mesas</p>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-hidden">
                <CanvasEditor initialData={floorPlans} />
            </div>
        </div>
    )
}

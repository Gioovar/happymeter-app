import { getReservationsAnalytics } from "@/actions/reservations"
import { ReservationsAnalytics } from "@/components/dashboard/reservations/ReservationsAnalytics"

export const dynamic = 'force-dynamic'

export default async function ReservationsAnalyticsPage() {
    const { success, data } = await getReservationsAnalytics()

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Analítica de Reservas</h1>
                    <p className="text-gray-400 mt-2">Métricas, tendencias y ocupación estratégica.</p>
                </div>
            </div>

            {!success || !data ? (
                <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center text-red-500">
                    <p>Error al cargar analítica.</p>
                </div>
            ) : (
                <ReservationsAnalytics data={data as any} />
            )}
        </div>
    )
}

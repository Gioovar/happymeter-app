import { getReservationsClients } from "@/actions/reservations"
import { ReservationsClientsList } from "@/components/dashboard/reservations/ReservationsClientsList"

export const dynamic = 'force-dynamic'

export default async function ReservationsClientsPage() {
    const { success, clients = [] } = await getReservationsClients()

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Clientes y No-Shows</h1>
                    <p className="text-gray-400 mt-2">Historial de comportamiento e inasistencias.</p>
                </div>
            </div>

            {!success ? (
                <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center text-red-500">
                    <p>Error al cargar cartera de clientes.</p>
                </div>
            ) : (
                <ReservationsClientsList clients={clients as any} />
            )}
        </div>
    )
}

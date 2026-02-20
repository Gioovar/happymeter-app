import { getAllReservationsList } from "@/actions/reservations"
import { ReservationsDataTable } from "@/components/dashboard/reservations/ReservationsDataTable"

export default async function ReservationsListPage() {
    const { success, reservations = [] } = await getAllReservationsList()

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Revisión de Reservas</h1>
                    <p className="text-gray-400 mt-2">Gestión completa, filtros e historial de estados.</p>
                </div>
            </div>

            {!success ? (
                <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center text-red-400">
                    <p>Error al cargar la lista de reservas.</p>
                </div>
            ) : (
                <ReservationsDataTable data={reservations as any} />
            )}
        </div>
    )
}

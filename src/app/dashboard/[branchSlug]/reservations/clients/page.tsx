import { getReservationsClients } from "@/actions/reservations"
import { ReservationsClientsList } from "@/components/dashboard/reservations/ReservationsClientsList"
import { getDashboardContext } from "@/lib/auth-context"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function BranchReservationsClientsPage({ params }: { params: { branchSlug: string } }) {
    const context = await getDashboardContext(params.branchSlug)
    if (!context || !context.userId) return redirect('/dashboard')

    const { success, clients = [] } = await getReservationsClients(context.userId)

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Clientes Locales <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300 align-middle">{context.name}</span></h1>
                    <p className="text-gray-400 mt-2">Historial de clientes en esta sucursal.</p>
                </div>
            </div>

            {!success ? (
                <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center text-red-500">
                    <p>Error al cargar cartera local.</p>
                </div>
            ) : (
                <ReservationsClientsList clients={clients as any} />
            )}
        </div>
    )
}

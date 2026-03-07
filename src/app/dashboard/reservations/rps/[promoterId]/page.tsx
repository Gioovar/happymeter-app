import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ArrowLeft, DollarSign, CalendarCheck, Clock, CheckCircle2, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { PayoutButtonModal } from "@/components/dashboard/reservations/PayoutButtonModal"

function formatCurrency(amo: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amo);
}

export default async function PromoterDetailPage({ params }: { params: { promoterId: string } }) {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');

    const promoterId = params.promoterId;

    const promoter = await (prisma.promoterProfile as any).findUnique({
        where: { id: promoterId, businessId: userId },
        include: {
            reservations: {
                orderBy: { date: 'desc' },
                include: { settlement: true }
            },
            settlements: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!promoter) {
        return (
            <div className="p-12 text-center">
                <h1 className="text-xl font-bold">Promotor no encontrado</h1>
                <Link href="/dashboard/reservations/rps">
                    <Button className="mt-4">Volver</Button>
                </Link>
            </div>
        )
    }

    // Unpaid Reservations calculations
    const unpaidReservations = promoter.reservations.filter((r: any) =>
        (r.status === 'CHECKED_IN' || r.status === 'CONFIRMED') && !r.settlementId
    );

    let totalOwed = 0;
    unpaidReservations.forEach((r: any) => {
        if (promoter.commissionType === 'PER_PERSON') {
            totalOwed += (r.partySize * promoter.commissionValue);
        } else if (promoter.commissionType === 'PERCENTAGE') {
            // Placeholder for percentage logic if invoice value exists
            totalOwed += promoter.commissionValue;
        }
    });

    const unpaidReservationIds = unpaidReservations.map((r: any) => r.id);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/reservations/rps">
                        <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{promoter.name}</h1>
                        <p className="text-zinc-500">
                            Código: <span className="font-mono text-indigo-400">{promoter.slug}</span> | Tel: {promoter.phone}
                        </p>
                    </div>
                </div>
            </div>

            {/* Payout Action Card */}
            <div className="bg-gradient-to-br from-indigo-900/30 to-violet-900/30 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10">
                    <DollarSign className="w-64 h-64 -mt-12 -mr-12" />
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                        <p className="text-indigo-300 font-medium mb-2 uppercase tracking-wide text-sm">Comisiones Pendientes de Pago</p>
                        <h2 className="text-5xl font-bold text-white mb-4">{formatCurrency(totalOwed)}</h2>

                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <CalendarCheck className="w-4 h-4 text-emerald-400" />
                                {unpaidReservations.length} Reservas
                            </div>
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Clock className="w-4 h-4 text-orange-400" />
                                {unpaidReservations.reduce((sum: number, r: any) => sum + r.partySize, 0)} Personas
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-start md:justify-end">
                        {unpaidReservations.length > 0 ? (
                            <PayoutButtonModal
                                promoterId={promoter.id}
                                amount={totalOwed}
                                reservationIds={unpaidReservationIds}
                            />
                        ) : (
                            <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-6 py-4 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-medium">Todo pagado al día</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Tabs area (History) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Unpaid Reservations List */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-400" />
                        Reservas por Liquidar
                    </h3>

                    {unpaidReservations.length === 0 ? (
                        <p className="text-zinc-500 text-sm py-4">No hay reservas pendientes de pago.</p>
                    ) : (
                        <div className="space-y-3">
                            {unpaidReservations.map((res: any) => (
                                <div key={res.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div>
                                        <p className="font-medium text-white">{res.customerName}</p>
                                        <p className="text-xs text-zinc-500">{format(new Date(res.date), "PPP", { locale: es })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-400">
                                            {formatCurrency(promoter.commissionType === 'PER_PERSON' ? res.partySize * promoter.commissionValue : promoter.commissionValue)}
                                        </p>
                                        <p className="text-xs text-zinc-500">{res.partySize} pax</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Settlement History */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-400" />
                        Historial de Pagos
                    </h3>

                    {promoter.settlements.length === 0 ? (
                        <p className="text-zinc-500 text-sm py-4">Aún no se han registrado pagos para este RP.</p>
                    ) : (
                        <div className="space-y-3">
                            {promoter.settlements.map((settlement: any) => (
                                <div key={settlement.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                    <div>
                                        <p className="font-medium text-white line-clamp-1">{settlement.notes || "Liquidación de Comisiones"}</p>
                                        <p className="text-xs text-zinc-500">{format(new Date(settlement.paidAt || settlement.createdAt), "PPP", { locale: es })}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-indigo-400">{formatCurrency(settlement.amount)}</p>
                                        <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                            Pagado
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

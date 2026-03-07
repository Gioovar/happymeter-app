import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Target, Plus, Users, DollarSign, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CreatePromoterModal } from "@/components/dashboard/reservations/CreatePromoterModal"
import { ConfigCommissionsModal } from "@/components/dashboard/reservations/ConfigCommissionsModal"
import { CreateEventModal } from "@/components/dashboard/reservations/CreateEventModal"

export const metadata = {
    title: "Gestión de RPs | HappyMeter",
}

async function getRpsData(userId: string) {
    const promoters = await prisma.promoterProfile.findMany({
        where: { businessId: userId },
        include: {
            reservations: {
                where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const settings = await (prisma.userSettings as any).findUnique({
        where: { userId },
        select: { defaultCommissionPerPerson: true }
    });

    // Fetch branches for modal
    const branches = await (prisma as any).branch.findMany({
        where: { chain: { ownerId: userId } },
        select: { id: true, businessName: true }
    });

    const mappedBranches = branches.map((b: any) => ({ id: b.id, name: b.businessName || 'Sucursal' }));

    return { promoters, settings, branches: mappedBranches };
}

export default async function RpsManagementPage() {
    const { userId } = await auth();
    if (!userId) {
        redirect('/sign-in');
    }

    const { promoters, settings, branches } = await getRpsData(userId);

    const defaultCommission = (settings as any)?.defaultCommissionPerPerson || 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Target className="w-6 h-6 text-indigo-500" />
                        Gestión de Promotores (RPs)
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        Controla el rendimiento, comisiones y eventos de tus Relaciones Públicas.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <CreateEventModal />
                    <ConfigCommissionsModal currentCommission={defaultCommission} />
                    <CreatePromoterModal branches={branches} />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between pb-2">
                        <p className="text-sm font-medium text-zinc-400">RPs Activos</p>
                        <Users className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold">{promoters.length}</h2>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between pb-2">
                        <p className="text-sm font-medium text-zinc-400">Total Personas</p>
                        <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold">
                        {promoters.reduce((acc, p) => acc + p.reservations.reduce((sum, r) => sum + r.partySize, 0), 0)}
                    </h2>
                </div>
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between pb-2">
                        <p className="text-sm font-medium text-zinc-400">Comisión Base</p>
                        <DollarSign className="w-4 h-4 text-amber-400" />
                    </div>
                    <h2 className="text-3xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((settings as any)?.defaultCommissionPerPerson || 0)}</h2>
                    <p className="text-xs text-zinc-500 mt-1">Por persona confirmada</p>
                </div>
            </div>

            {/* RPs List */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="font-bold text-lg">Directorio de RPs</h2>
                </div>

                {promoters.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-white mb-2">No tienes Promotores</h3>
                        <p className="mb-6">Añade a tu primer RP para empezar a generar reservas.</p>
                        <CreatePromoterModal branches={branches} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-black/20 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold font-mono text-zinc-500 uppercase tracking-widest">Promotor</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold font-mono text-zinc-500 uppercase tracking-widest">Contacto</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold font-mono text-zinc-500 uppercase tracking-widest">Reservas</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold font-mono text-zinc-500 uppercase tracking-widest">Personas</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold font-mono text-zinc-500 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {promoters.map((promoter: any) => {
                                    const totalAttendees = promoter.reservations.reduce((sum: number, r: any) => sum + r.partySize, 0);

                                    return (
                                        <tr key={promoter.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white">{promoter.name}</span>
                                                    <span className="text-xs text-zinc-500">/{promoter.slug}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-zinc-300">{promoter.phone}</span>
                                                    {promoter.email && <span className="text-xs text-zinc-500">{promoter.email}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium">{promoter.reservations.length}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-emerald-400">{totalAttendees} pax</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={`/dashboard/reservations/rps/${promoter.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-2">
                                                        Ver Detalle <Activity className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

import { getDashboardContext } from "@/lib/auth-context"
import { getPromoters } from "@/actions/promoters"
import { getChainDetails } from "@/actions/chain"
import { PromotersList } from "@/components/dashboard/reservations/PromotersList"
import { Target, Plus, TrendingUp, DollarSign, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreatePromoterModal } from "@/components/dashboard/reservations/CreatePromoterModal"
import { Card, CardContent } from "@/components/ui/card"

export default async function PromotersPage() {
    const context = await getDashboardContext()
    if (!context) return null

    const { promoters } = await getPromoters() as { promoters: any[] }
    const chains = await getChainDetails()

    // Flatten branches for selection
    const branches = chains?.flatMap(c => c.branches.map(b => ({
        id: b.branchId,
        name: b.name || b.branch.businessName || 'Sin nombre'
    }))) || []

    // Calculate Global Stats
    const totalPromoters = promoters?.length || 0

    const promotersWithStats = promoters?.map(p => {
        const confirmed = p.reservations.filter((r: any) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN')
            .reduce((sum: number, r: any) => sum + r.partySize, 0)

        const estCommission = p.commissionType === 'PER_PERSON'
            ? confirmed * p.commissionValue
            : 0 // Logic for % can be added

        return { ...p, confirmed, estCommission }
    })

    const topPromoter = promotersWithStats?.length > 0
        ? [...promotersWithStats].sort((a, b) => b.confirmed - a.confirmed)[0]
        : null

    const totalEstCommission = promotersWithStats?.reduce((sum, p) => sum + p.estCommission, 0) || 0

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Target className="w-8 h-8 text-indigo-500" />
                        Gestión Profesional de RPs
                    </h1>
                    <p className="text-zinc-400">Administra, mide y calcula el rendimiento de tus Relaciones Públicas.</p>
                </div>

                <CreatePromoterModal branches={branches} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-sm font-medium text-zinc-400">Total RPs</p>
                            <Target className="h-4 w-4 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">{totalPromoters}</h2>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-sm font-medium text-zinc-400">Top RP (Confirmados)</p>
                            <Users className="h-4 w-4 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white truncate max-w-[150px]">
                            {topPromoter ? topPromoter.name : '-'}
                        </h2>
                        {topPromoter && <p className="text-xs text-zinc-500">{topPromoter.confirmed} asistentes</p>}
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-sm font-medium text-zinc-400">Comisiones Pendientes</p>
                            <DollarSign className="h-4 w-4 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">${totalEstCommission.toFixed(2)}</h2>
                        <p className="text-xs text-zinc-500">Estimado total sin liquidar</p>
                    </CardContent>
                </Card>
            </div>

            <PromotersList initialPromoters={promoters} />
        </div>
    )
}

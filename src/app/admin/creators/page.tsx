
import { Suspense } from 'react'
import { getCreatorsExtended } from '@/actions/admin-dashboard' // Using the new extended action
import CreatorsTableExtended from '@/components/admin/CreatorsTableExtended'
import { Loader2, TrendingUp, Trophy, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminCreatorsPage() {
    const creators = await getCreatorsExtended()

    // Leaderboard Stats
    const totalRevenueGenerated = creators.reduce((acc, c) => acc + c.stats.totalSalesAmount, 0)
    const topCreator = [...creators].sort((a, b) => b.stats.totalSalesAmount - a.stats.totalSalesAmount)[0]

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">Creadores 2.0 (Elite)</h1>
                    <p className="text-gray-400 mt-1">Gestión avanzada de afiliados y partners.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-violet-500/10 border border-violet-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-full">
                            <DollarSign className="w-4 h-4 text-violet-500" />
                        </div>
                        <div>
                            <p className="text-xs text-violet-400 font-bold uppercase">Ventas Generadas</p>
                            <p className="text-xl font-bold text-white">${totalRevenueGenerated.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Leaderboard/Best Performer Highlight */}
            {topCreator && (
                <div className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-amber-500/5 blur-3xl rounded-full" />

                    <div className="flex items-center gap-6 z-10">
                        <div className="w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                            <Trophy className="w-8 h-8 text-black mb-1" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-amber-500 font-bold tracking-wider text-sm uppercase">Top Creator del Mes</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-1">{topCreator.code}</h2>
                            <p className="text-gray-400 text-sm">El partner con mayor impacto en ventas.</p>
                        </div>
                    </div>

                    <div className="flex gap-8 text-center z-10">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Ventas Totales</p>
                            <p className="text-2xl font-bold text-white">${topCreator.stats.totalSalesAmount.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Ref. Activos</p>
                            <p className="text-2xl font-bold text-white">{topCreator.stats.activeReferrals}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Comisión</p>
                            <p className="text-2xl font-bold text-amber-500">${topCreator.stats.commissionPending.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}

            <Suspense fallback={
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            }>
                <CreatorsTableExtended creators={creators} />
            </Suspense>
        </div>
    )
}

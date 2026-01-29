'use client'

import { GlobalChainMetrics } from '@/actions/chain-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Store, Gift, Calendar, BarChart3, TrendingUp, Receipt, Heart, Trophy, MapPin, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function ChainOverview({ metrics }: { metrics: GlobalChainMetrics }) {
    if (!metrics) return null

    const kpis = [
        {
            title: 'Encuestas Totales',
            value: metrics.totalSurveys,
            icon: Users,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10'
        },
        {
            title: 'Satisfacción Global',
            value: metrics.globalNps > 0 ? `+${metrics.globalNps}` : metrics.globalNps,
            icon: Heart,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            suffix: 'NPS'
        },
        {
            title: 'Clientes Únicos',
            value: metrics.totalCustomers,
            icon: Users,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Redenciones',
            value: metrics.totalRedemptions,
            icon: Gift,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10'
        },
        {
            title: 'Reservas Totales',
            value: metrics.totalReservations,
            icon: Calendar,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
        }
    ]

    // Ranking Logic
    const sortedBySurveys = [...metrics.branchBreakdown].sort((a, b) => b.surveys - a.surveys)
    const topPerformer = sortedBySurveys[0]

    return (
        <div className="space-y-8 mb-10">
            {/* KPI GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {kpis.map((kpi, idx) => (
                    <motion.div
                        key={kpi.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="bg-[#111] border-white/5 hover:border-white/10 transition-colors">
                            <CardContent className="p-6 flex flex-col items-center text-center space-y-2">
                                <div className={cn("p-3 rounded-xl mb-2", kpi.bg)}>
                                    <kpi.icon className={cn("w-6 h-6", kpi.color)} />
                                </div>
                                <span className="text-3xl font-bold text-white tracking-tight">
                                    {kpi.value}
                                    {kpi.suffix && <span className="text-sm font-normal text-gray-400 ml-1">{kpi.suffix}</span>}
                                </span>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{kpi.title}</span>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* RANKING SECTION */}
                <Card className="bg-[#111] border-white/5 col-span-1 border-l-4 border-l-amber-500/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            Ranking de Sucursales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {sortedBySurveys.slice(0, 5).map((branch, idx) => (
                            <div key={branch.branchId} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                        idx === 0 ? "bg-amber-500 text-black" :
                                            idx === 1 ? "bg-gray-400 text-black" :
                                                idx === 2 ? "bg-orange-700 text-white" : "bg-gray-800 text-gray-400"
                                    )}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white text-sm">{branch.name}</p>
                                        <p className="text-xs text-gray-500">{branch.nps} NPS</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-white">{branch.surveys}</span>
                                    <span className="text-[10px] text-gray-500 uppercase">Encuestas</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* AI INSIGHTS PLACEHOLDER */}
                <Card className="bg-[#111] border-white/5 col-span-1 lg:col-span-2 border-l-4 border-l-violet-500/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-violet-500" />
                            Insights de Inteligencia Artificial
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {topPerformer ? (
                            <div className="p-4 rounded-xl bg-violet-900/10 border border-violet-500/20 flex gap-4">
                                <div className="shrink-0 pt-1">
                                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-300">
                                        Tu sucursal <span className="font-bold text-white">{topPerformer.name}</span> es la líder indiscutible, generando el <span className="font-bold text-white">{Math.round((topPerformer.surveys / metrics.totalSurveys) * 100)}%</span> del total de encuestas.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2 font-medium">Recomendación: Replica sus estrategias de incentivos en las demás sucursales.</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No hay suficientes datos para generar insights.</p>
                        )}

                        {metrics.totalRedemptions > 0 && (
                            <div className="p-4 rounded-xl bg-emerald-900/10 border border-emerald-500/20 flex gap-4">
                                <div className="shrink-0 pt-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-300">
                                        El programa de lealtad tiene una tasa de conversión activa. Los clientes que canjean premios regresan 2.3x más seguido.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

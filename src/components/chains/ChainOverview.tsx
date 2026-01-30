'use client'

import { GlobalChainMetrics } from '@/actions/chain-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Store, Gift, Calendar, BarChart3, TrendingUp, Receipt, Heart, Trophy, MapPin, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import ChainTrendsChart from './ChainTrendsChart'

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* CHART SECTION */}
                <div className="lg:col-span-2 h-[400px]">
                    <ChainTrendsChart data={metrics.satisfactionTrend} branches={metrics.branchBreakdown} />
                </div>

                {/* RANKING SECTION */}
                <div className="space-y-6">
                    <Card className="bg-[#111] border-white/5 border-l-4 border-l-amber-500/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                Top Sucursales (Encuestas)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sortedBySurveys.slice(0, 5).map((branch, idx) => (
                                <div key={branch.branchId} className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs",
                                            idx === 0 ? "bg-amber-500 text-black" :
                                                idx === 1 ? "bg-gray-400 text-black" :
                                                    idx === 2 ? "bg-orange-700 text-white" : "bg-gray-800 text-gray-400"
                                        )}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-xs truncate max-w-[120px]">
                                                {(branch.name && branch.name !== 'Sede Principal') ? branch.name : (branch.businessName || branch.name)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-white text-sm">{branch.surveys}</span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* AI INSIGHTS SMALL */}
                    <Card className="bg-[#111] border-white/5 border-l-4 border-l-violet-500/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <AlertCircle className="w-4 h-4 text-violet-500" />
                                Insights IA
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {topPerformer ? (
                                <div className="p-3 rounded-lg bg-violet-900/10 border border-violet-500/20 text-xs">
                                    <p className="text-gray-300">
                                        <strong className="text-white">{(topPerformer.name && topPerformer.name !== 'Sede Principal') ? topPerformer.name : (topPerformer.businessName || topPerformer.name)}</strong> genera el <strong className="text-white">{metrics.totalSurveys > 0 ? Math.round((topPerformer.surveys / metrics.totalSurveys) * 100) : 0}%</strong> de tu data total.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">Sin datos suficientes.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

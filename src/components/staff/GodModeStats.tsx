'use client'

import { Activity, BarChart3, Globe, ShieldCheck, Zap } from 'lucide-react'

interface GodModeStatsProps {
    data: {
        roi: number
        conversionRate: number
        systemHealth: number
        trafficSource: { source: string; percentage: number }[]
    }
}

export default function GodModeStats({ data }: GodModeStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* ROI Card */}
            <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 bg-violet-500/10 blur-2xl rounded-full group-hover:bg-violet-500/20 transition duration-500" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-violet-400">
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-xs font-bold tracking-wider uppercase">ROI Global</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-4xl font-black text-white">{data.roi}%</h3>
                        <span className="text-green-400 text-sm font-bold mb-2">+12% vs mes pasado</span>
                    </div>
                </div>
            </div>

            {/* Conversion Rate Card */}
            <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 bg-emerald-500/10 blur-2xl rounded-full group-hover:bg-emerald-500/20 transition duration-500" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <Activity className="w-5 h-5" />
                        <span className="text-xs font-bold tracking-wider uppercase">Conversión</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-4xl font-black text-white">{data.conversionRate}%</h3>
                        <span className="text-emerald-400 text-sm font-bold mb-2">Excelente</span>
                    </div>
                </div>
            </div>

            {/* System Health Card */}
            <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 bg-blue-500/10 blur-2xl rounded-full group-hover:bg-blue-500/20 transition duration-500" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-blue-400">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-xs font-bold tracking-wider uppercase">Salud del Sistema</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <h3 className="text-4xl font-black text-white">{data.systemHealth}%</h3>
                        <span className="text-blue-400 text-sm font-bold mb-2">Operacional</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1 mt-3">
                        <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: `${data.systemHealth}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Traffic Source Card (Mini List) */}
            <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 bg-pink-500/10 blur-2xl rounded-full group-hover:bg-pink-500/20 transition duration-500" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4 text-pink-400">
                        <Globe className="w-5 h-5" />
                        <span className="text-xs font-bold tracking-wider uppercase">Tráfico</span>
                    </div>
                    <div className="space-y-2">
                        {data.trafficSource.map((source, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-medium">{source.source}</span>
                                <span className="text-white font-bold">{source.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import ProcessTeamManager from './ProcessTeamManager'
import {
    Users,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    Search,
    Filter
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ProcessTeamViewProps {
    teamData: any
    performanceStats: any[]
    branchId: string
}

export default function ProcessTeamView({ teamData, performanceStats, branchId }: ProcessTeamViewProps) {
    const [searchTerm, setSearchTerm] = useState('')

    // Overall metrics calculation
    const totalStaff = performanceStats.length
    const avgCompliance = totalStaff > 0
        ? Math.round(performanceStats.reduce((acc, s) => acc + s.stats.complianceRate, 0) / totalStaff)
        : 0

    const lowPerformers = performanceStats.filter(s => s.stats.complianceRate < 70).length

    const filteredStats = performanceStats.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.jobTitle && s.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div>
            {/* Header / Summary Section */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Desempeño de Personal</h1>
                <p className="text-gray-500 font-medium">Panel de control operativo y cumplimiento de tareas por colaborador</p>
            </div>
            <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Reporte de Operaciones</h2>
                <p className="text-xs text-gray-400 font-medium">Monitoreo de tareas y cumplimiento operativo diario</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#121418] to-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-all" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Plantilla Total</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-white">{totalStaff}</h3>
                        <span className="text-xs text-gray-500 font-bold">Colaboradores</span>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#121418] to-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-600/10 rounded-full blur-3xl group-hover:bg-emerald-600/20 transition-all" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cumplimiento Global</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-emerald-400">{avgCompliance}%</h3>
                        <div className="flex items-center text-[10px] text-emerald-500/70 font-bold bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                            HOY <ArrowUpRight className="w-3 h-3 ml-0.5" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#121418] to-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-600/10 rounded-full blur-3xl group-hover:bg-rose-600/20 transition-all" />
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-rose-400" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Alertas Críticas</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-black text-white">{lowPerformers}</h3>
                        <span className="text-xs text-gray-500 font-bold">Bajo Rendimiento</span>
                    </div>
                </div>
            </div>

            {/* Main Manager UI */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-2">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o puesto..."
                            className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="rounded-2xl border-white/5 bg-[#0a0a0a] text-gray-400 hover:text-white h-11 px-6 font-bold text-xs uppercase tracking-widest">
                            <Filter className="w-4 h-4 mr-2" /> Filtrar
                        </Button>
                    </div>
                </div>

                <ProcessTeamManager
                    initialData={teamData}
                    branchId={branchId}
                    performanceStats={filteredStats}
                />
            </div>
        </div>
    )
}

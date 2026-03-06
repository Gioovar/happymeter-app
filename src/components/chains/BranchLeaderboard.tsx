'use client'

import { GlobalChainMetrics } from '@/actions/chain-analytics'
import { Trophy, TrendingUp, Users, Star, ArrowRight, Medal } from 'lucide-react'
import Link from 'next/link'

interface BranchLeaderboardProps {
    metrics: GlobalChainMetrics
}

export default function BranchLeaderboard({ metrics }: BranchLeaderboardProps) {
    if (!metrics || metrics.branchBreakdown.length === 0) return null

    // Algorithm: Rank branches primarily by NPS. If tied, rank by volume of surveys (reliability).
    const rankedBranches = [...metrics.branchBreakdown].sort((a, b) => {
        if (b.nps !== a.nps) {
            return b.nps - a.nps
        }
        return b.surveys - a.surveys
    })

    const getMedal = (index: number) => {
        if (index === 0) return <span className="text-2xl drop-shadow-md" title="1er Lugar">🥇</span>
        if (index === 1) return <span className="text-2xl drop-shadow-md" title="2do Lugar">🥈</span>
        if (index === 2) return <span className="text-2xl drop-shadow-md" title="3er Lugar">🥉</span>
        return <span className="text-sm font-bold text-gray-500 px-2">#{index + 1}</span>
    }

    return (
        <div className="flex flex-col h-full rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden shadow-2xl transition-all p-6 relative">

            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="mb-6 relative z-10 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Trophy className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                        Ranking Interno de Sucursales
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Clasificación automática basada en Satisfacción Promedio (NPS) y volumen.
                    </p>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="flex-1 space-y-3 relative z-10">
                {rankedBranches.map((branch, index) => {
                    const isTop3 = index < 3;
                    return (
                        <div
                            key={branch.branchId}
                            className={`relative p-4 rounded-2xl flex items-center justify-between group transition-all duration-300 ${isTop3 ? 'bg-gradient-to-r from-white/5 to-transparent border border-white/10 shadow-lg' : 'bg-transparent border border-white/5 hover:bg-white/5'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 flex justify-center items-center">
                                    {getMedal(index)}
                                </div>
                                <div>
                                    <h4 className={`font-bold ${isTop3 ? 'text-white text-base' : 'text-gray-300 text-sm'}`}>
                                        {branch.name}
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {branch.surveys} encuestas</span>
                                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500/50" /> {branch.periods.today.rating || '-'} hoy</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className={`text-lg font-black tracking-tight ${branch.nps >= 70 ? 'text-emerald-400' : branch.nps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {branch.nps}
                                    </div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        NPS Score
                                    </div>
                                </div>
                                <Link href={`/dashboard/${branch.branchId}`} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white opacity-0 group-hover:opacity-100 transition-all">
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    )
}

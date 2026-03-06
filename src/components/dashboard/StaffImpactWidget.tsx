'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp, TrendingDown, Star, AlertTriangle, Medal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StaffImpactData {
    topPerformers: {
        name: string
        mentions: number
        rating: number
        nps: number
        sentiment: string
    }[]
    underPerformers: {
        name: string
        mentions: number
        rating: number
        nps: number
        sentiment: string
    }[]
    totalStaffTracked: number
}

export default function StaffImpactWidget() {
    const [data, setData] = useState<StaffImpactData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch('/api/ai/staff-impact')
            .then(res => res.json())
            .then(resData => {
                setData(resData)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch staff impact:', err)
                setIsLoading(false)
            })
    }, [])

    if (isLoading) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-full animate-pulse">
                <CardHeader>
                    <div className="h-6 w-3/4 bg-white/5 rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-16 w-full bg-white/5 rounded-2xl"></div>
                        <div className="h-16 w-full bg-white/5 rounded-2xl"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data || data.totalStaffTracked === 0) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-full flex flex-col items-center justify-center p-6 text-center">
                <Users className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400 font-medium">No hay suficientes datos de personal.</p>
                <p className="text-xs text-gray-500 mt-2 max-w-[200px]">Asegúrate de que tus encuestas pregunten el nombre de quién los atendió.</p>
            </Card>
        )
    }

    return (
        <Card className="bg-[#0F0F0F] border-white/5 h-full flex flex-col relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

            <CardHeader className="pb-3 relative z-10">
                <CardTitle className="text-lg font-bold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-400" />
                        Impacto del Personal
                    </div>
                </CardTitle>
                <p className="text-xs text-gray-400">Rendimiento basado en satisfacción al cliente ({data.totalStaffTracked} evaluados).</p>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10 flex-1 flex flex-col">

                {/* Top Performers */}
                {data.topPerformers.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" /> Estrellas de Servicio
                        </h4>
                        <div className="space-y-2">
                            {data.topPerformers.map((staff, idx) => (
                                <div key={idx} className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/10 rounded-xl p-3 flex justify-between items-center transition-all hover:bg-emerald-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-inner">
                                            {idx === 0 ? <Medal className="w-4 h-4" /> : idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">{staff.name}</p>
                                            <p className="text-xs text-emerald-200/60 flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-emerald-500/50" /> {staff.rating} prom. ({staff.mentions} menciones)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black tracking-tight text-emerald-400">+{staff.nps}</p>
                                        <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-500/50">NPS</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Underperformers */}
                {data.underPerformers.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                            <TrendingDown className="w-3.5 h-3.5" /> Requieren Atención
                        </h4>
                        <div className="space-y-2">
                            {data.underPerformers.map((staff, idx) => (
                                <div key={idx} className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-300">{staff.name}</p>
                                            <p className="text-xs text-rose-200/50 flex items-center gap-1">
                                                <Star className="w-3 h-3 text-rose-500/30" /> {staff.rating} prom. ({staff.mentions} menciones)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold tracking-tight text-rose-400">{staff.nps}</p>
                                        <p className="text-[9px] uppercase tracking-wider font-bold text-rose-500/40">NPS</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>
    )
}

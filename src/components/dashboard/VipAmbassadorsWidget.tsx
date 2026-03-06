'use client'

import { useState, useEffect } from 'react'
import { Crown, Heart, Star, Sparkles, TicketPercent, Wallet, CalendarDays, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface VipData {
    ambassadors: {
        name: string
        phone: string
        visits: number
        totalSpent: number
        daysSinceLastVisit: number
        avgNps: number
        sentimentCategory: string
        tier: string
        rfmScore: number
    }[]
    vips: {
        name: string
        phone: string
        visits: number
        totalSpent: number
        daysSinceLastVisit: number
        avgNps: number
        sentimentCategory: string
        tier: string
        rfmScore: number
    }[]
    totalIdentified: number
}

export default function VipAmbassadorsWidget() {
    const [data, setData] = useState<VipData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch('/api/ai/vip-radar')
            .then(res => res.json())
            .then(resData => {
                setData(resData)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch VIP radar:', err)
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

    if (!data || data.totalIdentified === 0) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-full flex flex-col items-center justify-center p-6 text-center">
                <Crown className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
                <p className="text-gray-400 font-medium">Buscando Clientes VIP...</p>
                <p className="text-xs text-gray-500 mt-2 max-w-[200px]">Aún no hay suficientes encuestas con teléfono para perfilar clientes de alto valor.</p>
            </Card>
        )
    }

    return (
        <Card className="bg-[#0F0F0F] border-white/5 h-full flex flex-col relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-amber-500/10" />

            <CardHeader className="pb-3 relative z-10 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                        <Crown className="w-5 h-5 text-amber-400" />
                        CRM de Embajadores
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1">
                        IA ha identificado <span className="text-amber-400 font-bold">{data.totalIdentified}</span> clientes clave basado en lealtad y NPS.
                    </p>
                </div>
                {/* Optional button to link to full CRM if it existed */}
                {/* <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition">
                    <ExternalLink className="w-4 h-4" />
                </button> */}
            </CardHeader>

            <CardContent className="space-y-6 relative z-10 flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar">

                {data.ambassadors.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-400/80">
                            <Sparkles className="w-3.5 h-3.5" /> Nivel: Embajadores (Promotores Constantes)
                        </h4>
                        <div className="space-y-2">
                            {data.ambassadors.map((customer, idx) => (
                                <div key={idx} className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl p-3 hover:bg-amber-500/20 transition-colors group/card">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-sm text-amber-50">{customer.name}</p>
                                            <p className="text-xs text-amber-200/50">{customer.phone}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                                                <Heart className="w-3 h-3 fill-amber-400" /> Score: {customer.rfmScore}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs mt-3 pt-3 border-t border-amber-500/10">
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <Star className="w-3.5 h-3.5 text-green-400" />
                                            <span>NPS: {customer.avgNps}/10</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-400">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            <span>{customer.visits} visitas</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button className="w-full mt-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition flex items-center justify-center gap-2 opacity-0 group-hover/card:opacity-100">
                                        <TicketPercent className="w-3.5 h-3.5" />
                                        Enviar Recompensa VIP (Próximamente)
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {data.vips.length > 0 && (
                    <div className="space-y-3 pt-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80">
                            Nivel: VIP (Alta Frecuencia)
                        </h4>
                        <div className="space-y-2">
                            {data.vips.map((customer, idx) => (
                                <div key={idx} className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex justify-between items-center transition-colors hover:bg-blue-500/10">
                                    <div>
                                        <p className="font-bold text-sm text-gray-300">{customer.name}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">{customer.visits} visitas • Última hace {customer.daysSinceLastVisit} días</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="flex items-center gap-1" title="NPS Score">
                                            {customer.avgNps >= 8 ? (
                                                <Star className="w-3 h-3 text-green-400" />
                                            ) : (
                                                <Star className="w-3 h-3 text-yellow-500" />
                                            )}
                                            <span className="text-xs font-bold text-gray-400">{customer.avgNps || '-'}</span>
                                        </div>
                                        <span className="text-[9px] text-blue-400/50 uppercase tracking-widest mt-1">Puntos: {customer.rfmScore}</span>
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

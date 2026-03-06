'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingDown, Users, BadgeAlert, Coins, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RoiData {
    averageTicket: number
    estimatedAnnualCustomerValue: number
    detractorsCount: number
    estimatedLostCustomers: number
    financialImpact: {
        projectedAnnualLoss: number
        monthlyLossRate: number
        potentialRecoveryValue: number
    }
    metrics: {
        detractorChurnRate: number
        passiveChurnRate: number
    }
}

export default function RoiCalculatorWidget() {
    const [data, setData] = useState<RoiData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch('/api/ai/roi-calculator')
            .then(res => res.json())
            .then(resData => {
                setData(resData)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch ROI calculator data:', err)
                setIsLoading(false)
            })
    }, [])

    if (isLoading) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-full animate-pulse lg:col-span-1">
                <CardHeader>
                    <div className="h-6 w-3/4 bg-white/5 rounded"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-20 w-full bg-white/5 rounded-2xl"></div>
                        <div className="h-16 w-full bg-white/5 rounded-2xl"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data) return null;

    // Formatting Helpers
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <Card className="bg-[#0F0F0F] border-white/5 h-full relative overflow-hidden group">
            {/* Bleeding Aura that flashes when loss is detected */}
            {data.financialImpact.monthlyLossRate > 0 && (
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose-600/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-rose-500/20 transition-all duration-700" />
            )}

            <CardHeader className="pb-3 relative z-10 flex flex-row items-center justify-between border-b border-white/5">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                        <BadgeAlert className="w-5 h-5 text-rose-500" />
                        Pérdida por Fricción (ROI)
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        Basado en LTV actual de <span className="text-white font-bold">{formatCurrency(data.estimatedAnnualCustomerValue)}/año</span>
                    </p>
                </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-5 relative z-10 flex-1 flex flex-col">

                {/* Principal Loss Metric */}
                <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 rounded-2xl group-hover:bg-rose-500/5 transition-colors">
                    <p className="text-xs font-bold uppercase tracking-widest text-rose-400/80 mb-2 flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5" /> Fuga de Capital Mensual (Est.)
                    </p>
                    <h3 className="text-3xl font-black text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                        {formatCurrency(data.financialImpact.monthlyLossRate)}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-3 text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2.5 py-1 rounded">
                        <Users className="w-3 h-3" />
                        {data.estimatedLostCustomers} Clientes en riesgo de no volver
                    </div>
                </div>

                {/* Submetrics Split Row */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-1.5 mb-1">
                            <RefreshCw className="w-3 h-3 text-emerald-400" /> ROI Recuperable
                        </p>
                        <p className="text-sm font-bold text-emerald-400">{formatCurrency(data.financialImpact.potentialRecoveryValue)}</p>
                        <p className="text-[9px] text-gray-600 mt-0.5 leading-tight">Si se salva al 20% con Growth Engine</p>
                    </div>

                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-end">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1">
                            <Coins className="w-3 h-3" /> Coste Anual
                        </p>
                        <p className="text-sm font-bold text-gray-300">{formatCurrency(data.financialImpact.projectedAnnualLoss)}</p>
                    </div>
                </div>

                {/* Contextual Action Warning */}
                {data.detractorsCount > 0 ? (
                    <div className="mt-auto px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                        <p className="text-xs text-indigo-300 leading-relaxed font-medium">
                            Hay <span className="font-bold text-white">{data.detractorsCount} detractores</span> recientes. Una campaña de descuento por SMS a este segmento podría rescatar capital crítico este mes.
                        </p>
                    </div>
                ) : (
                    <div className="mt-auto px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-xs text-emerald-300 leading-relaxed font-medium">
                            Excelente retención detectada. Nivel de fuga de capital por debajo del umbral de alerta.
                        </p>
                    </div>
                )}

            </CardContent>
        </Card>
    )
}

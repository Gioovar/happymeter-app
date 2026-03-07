'use client'

import { useState, useEffect } from 'react'
import { Rocket, Zap, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FeatureGuard from '@/components/common/FeatureGuard'
import { toast } from 'sonner'

interface AutopilotProposal {
    id: string
    type: string
    urgencyLevel: string
    title: string
    description: string
    targetSegment: string
    estimatedReach: string
    projectedRoi: string
    status: string
}

interface AutopilotData {
    success: boolean
    requiresAction: boolean
    proposal?: AutopilotProposal
    message?: string
}

export default function AutopilotWidget() {
    const [data, setData] = useState<AutopilotData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [actionTaken, setActionTaken] = useState(false)

    useEffect(() => {
        fetch('/api/ai/autopilot')
            .then(res => res.json())
            .then(resData => {
                setData(resData)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch Autopilot data:', err)
                setIsLoading(false)
            })
    }, [])

    const handleApprove = () => {
        setActionTaken(true)
        toast.success('Campaña Flash programada con éxito. Ejecutando envíos.')
    }

    const handleReject = () => {
        setActionTaken(true)
        toast.info('Propuesta ignorada. La IA analizará la ocupación de nuevo mañana.')
    }

    if (isLoading) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-[350px] animate-pulse">
                <CardHeader>
                    <div className="h-6 w-1/2 bg-white/5 rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-40 w-full bg-white/5 rounded-2xl"></div>
                </CardContent>
            </Card>
        )
    }

    if (!data) return null;

    return (
        <FeatureGuard feature="ai_analytics">
            <Card className="bg-[#0F0F0F] border-white/5 h-full relative overflow-hidden flex flex-col group lg:col-span-2">
                {/* Background Glow Contextual */}
                {data.requiresAction && !actionTaken && (
                    <div className="absolute top-10 -left-10 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-fuchsia-500/15 transition-all duration-700" />
                )}

                <CardHeader className="pb-4 relative z-10 border-b border-white/5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                        <Rocket className="w-5 h-5 text-fuchsia-500" />
                        Autopiloto Promocional (IA)
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1">
                        Campañas sugeridas proactivamente ante bajas de afluencia o KPIs en riesgo.
                    </p>
                </CardHeader>

                <CardContent className="pt-6 relative z-10 flex-1 flex flex-col justify-center">
                    {!data.requiresAction || actionTaken ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-3 p-6 opacity-60 h-full">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-300">Autopiloto en Standby</p>
                            <p className="text-xs text-gray-500 max-w-[200px]">
                                {actionTaken ? 'Has reaccionado a la última propuesta de IA.' : (data.message || 'No hay campañas en pausa. Tu flujo proyectado es óptimo.')}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full justify-between">
                            <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-2xl p-5 mb-4 relative overflow-hidden">

                                <div className="flex items-center justify-between mb-3">
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-fuchsia-500/20 text-fuchsia-300 px-2 py-1 rounded">
                                        <Zap className="w-3 h-3" /> Recomendación Urgente
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">Hace 2 horas</span>
                                </div>

                                <h4 className="text-lg font-black text-white mb-2">{data.proposal?.title}</h4>
                                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                                    {data.proposal?.description}
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3">
                                        <p className="text-[9px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-1">
                                            <Users className="w-3 h-3 text-cyan-500" /> Audiencia (Alcance)
                                        </p>
                                        <p className="text-xs font-bold text-white">{data.proposal?.estimatedReach}</p>
                                    </div>
                                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3">
                                        <p className="text-[9px] text-gray-500 uppercase font-bold flex items-center gap-1 mb-1">
                                            <TrendingUp className="w-3 h-3 text-emerald-500" /> ROI Proyectado
                                        </p>
                                        <p className="text-xs font-bold text-emerald-400">{data.proposal?.projectedRoi}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <button
                                    onClick={handleReject}
                                    className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all rounded-xl text-sm font-bold text-gray-400 hover:text-white"
                                >
                                    <XCircle className="w-4 h-4" /> Ignorar
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="flex items-center justify-center gap-2 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 transition-all rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)]"
                                >
                                    <Rocket className="w-4 h-4" /> Aprobar y Lanzar
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </FeatureGuard>
    )
}

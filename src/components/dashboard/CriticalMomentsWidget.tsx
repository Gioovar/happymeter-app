'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, CalendarDays, Zap, Lightbulb, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FeatureGuard from '@/components/common/FeatureGuard'

interface CriticalMoment {
    title: string
    dayOfWeek: string
    timeBlock: string
    recurringIssue: string
    impactLevel: 'HIGH' | 'MEDIUM' | 'LOW'
    suggestedAction: string
}

interface MomentsData {
    success: boolean
    hasCriticalMoments: boolean
    criticalMoments: CriticalMoment[]
    message?: string
}

export default function CriticalMomentsWidget() {
    const [data, setData] = useState<MomentsData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch('/api/ai/critical-moments')
            .then(res => res.json())
            .then(resData => {
                setData(resData)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch critical moments:', err)
                setIsLoading(false)
            })
    }, [])

    if (isLoading) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-[350px] animate-pulse">
                <CardHeader>
                    <div className="h-6 w-1/2 bg-white/5 rounded"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-24 w-full bg-white/5 rounded-2xl"></div>
                    <div className="h-24 w-full bg-white/5 rounded-2xl"></div>
                </CardContent>
            </Card>
        )
    }

    if (!data) return null;

    return (
        <FeatureGuard feature="ai_analytics">
            <Card className="bg-[#0F0F0F] border-white/5 h-full relative overflow-hidden flex flex-col group">
                {/* Background Glow Contextual */}
                {data.hasCriticalMoments && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-amber-500/10 transition-all duration-700" />
                )}

                <CardHeader className="pb-4 relative z-10 border-b border-white/5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Momentos Clínicos Operativos
                    </CardTitle>
                    <p className="text-xs text-gray-400 mt-1">
                        La IA detecta cuellos de botella cruzando quejas por día y hora.
                    </p>
                </CardHeader>

                <CardContent className="pt-6 relative z-10 flex-1 overflow-y-auto hide-scrollbar space-y-4">
                    {!data.hasCriticalMoments ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6 opacity-60">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                                <Zap className="w-6 h-6 text-gray-500" />
                            </div>
                            <p className="text-sm font-bold text-gray-400">Operación Fluida</p>
                            <p className="text-xs text-gray-500 max-w-[200px]">
                                {data.message || 'No se han detectado patrones de falla repetitivos en rangos de horario específicos.'}
                            </p>
                        </div>
                    ) : (
                        data.criticalMoments.map((moment, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-amber-500/30 transition-colors group/item relative overflow-hidden">

                                {/* Severity Line */}
                                <div className={`absolute top-0 left-0 bottom-0 w-1 ${moment.impactLevel === 'HIGH' ? 'bg-rose-500' : moment.impactLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'}`} />

                                <div className="pl-3">
                                    <h4 className="font-bold text-sm text-white mb-2">{moment.title}</h4>

                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="flex items-center gap-1 text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 font-medium">
                                            <CalendarDays className="w-3 h-3 text-violet-400" /> {moment.dayOfWeek}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] bg-white/5 px-2 py-1 rounded text-gray-400 font-medium">
                                            <Clock className="w-3 h-3 text-cyan-400" /> {moment.timeBlock}
                                        </span>
                                    </div>

                                    <div className="bg-[#111] rounded-xl p-3 mb-3 border border-white/5 relative">
                                        <div className="absolute -top-2 left-4 px-2 bg-[#111] text-[9px] font-bold text-gray-500 uppercase tracking-widest">Patrón Detectado</div>
                                        <p className="text-xs text-gray-300 italic">"{moment.recurringIssue}"</p>
                                    </div>

                                    <div className="flex items-start gap-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                                            {moment.suggestedAction}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </FeatureGuard>
    )
}

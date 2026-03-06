'use client'

import { useState, useEffect } from 'react'
import { Activity, Clock, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HourlyFlow {
    hour: string
    occupancyPercentage: number
    projectedPax: number
    reservedPax: number
    status: string
}

interface OccupancyData {
    fullDay: HourlyFlow[]
    immediateForecast: HourlyFlow[]
    overallTrend: 'CAYENDO' | 'SATURADO' | 'ESTABLE'
}

export default function OccupancyRadarWidget() {
    const [data, setData] = useState<OccupancyData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch('/api/ai/occupancy-prediction')
            .then(res => res.json())
            .then(resData => {
                setData(resData)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch occupancy:', err)
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
                        <div className="h-24 w-full bg-white/5 rounded-2xl"></div>
                        <div className="h-16 w-full bg-white/5 rounded-2xl"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!data || data.fullDay.length === 0) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-full flex flex-col items-center justify-center p-6 text-center">
                <Activity className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
                <p className="text-gray-400 font-medium">Radar de Ocupación Inactivo.</p>
                <p className="text-xs text-gray-500 mt-2 max-w-[200px]">Acumulando historial de reservaciones y visitas para predecir tráfico.</p>
            </Card>
        )
    }

    const maxPax = Math.max(...data.fullDay.map(d => d.projectedPax)) || 10

    return (
        <Card className="bg-[#0F0F0F] border-white/5 h-full lg:col-span-2 flex flex-col relative overflow-hidden group">
            {/* Background Glow based on Trend */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-all duration-1000 ${data.overallTrend === 'SATURADO' ? 'bg-rose-500/10' :
                    data.overallTrend === 'CAYENDO' ? 'bg-sky-500/10' : 'bg-emerald-500/10'
                }`} />

            <CardHeader className="pb-3 relative z-10 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                        <Activity className="w-5 h-5 text-indigo-400" />
                        Predicción de Flujo y Ocupación
                    </CardTitle>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-1">
                        Tendencia actual:
                        <span className={`font-bold flex items-center gap-1 ${data.overallTrend === 'SATURADO' ? 'text-rose-400' :
                                data.overallTrend === 'CAYENDO' ? 'text-sky-400' : 'text-emerald-400'
                            }`}>
                            {data.overallTrend === 'CAYENDO' && <TrendingDown className="w-3.5 h-3.5" />}
                            {data.overallTrend === 'SATURADO' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {data.overallTrend === 'ESTABLE' && <TrendingUp className="w-3.5 h-3.5" />}
                            {data.overallTrend}
                        </span>
                    </p>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10 flex-1 flex flex-col">

                {/* Visual Bar Chart */}
                <div className="flex-1 min-h-[160px] flex items-end justify-between gap-1.5 pt-6 pb-2 border-b border-white/5 relative">
                    {/* Horizontal capacity guidelines */}
                    <div className="absolute inset-x-0 bottom-[60%] border-t border-dashed border-white/5 h-px" />
                    <div className="absolute inset-x-0 bottom-[85%] border-t border-dashed border-rose-500/20 h-px">
                        <span className="absolute -top-4 right-0 text-[8px] text-rose-500/50 uppercase font-bold tracking-widest">Capacidad Máxima</span>
                    </div>

                    {data.fullDay.map((hour, idx) => {
                        const hInt = parseInt(hour.hour);
                        // Make only currently active or upcoming hours pop
                        const currentH = new Date().getHours()
                        const isPast = hInt < currentH
                        const isCurrent = hInt === currentH

                        const barHeightPercentage = Math.min((hour.projectedPax / maxPax) * 100, 100)

                        return (
                            <div key={idx} className="flex flex-col items-center justify-end h-full gap-2 relative group/bar w-full">
                                <div className="absolute -top-8 bg-black border border-white/10 p-2 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity z-20 pointer-events-none w-[120px] text-center shadow-xl">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">{hour.hour}</p>
                                    <p className="text-sm font-bold text-white mb-0.5">{hour.status}</p>
                                    <p className="text-[10px] text-indigo-400 font-medium">Pax Proyectados: {hour.projectedPax}</p>
                                    <p className="text-[9px] text-gray-500">Reservaciones: {hour.reservedPax}</p>
                                </div>

                                <div
                                    className={`w-full rounded-t-md transition-all duration-500 ${isPast ? 'bg-white/10 opacity-50 grayscale' :
                                            isCurrent ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' :
                                                hour.status === 'Lleno' ? 'bg-rose-500' :
                                                    hour.status === 'Alta' ? 'bg-amber-500' : 'bg-indigo-400/60'
                                        }`}
                                    style={{ height: `${barHeightPercentage}%`, minHeight: '4px' }}
                                />
                                <span className={`text-[9px] font-medium leading-none ${isCurrent ? 'text-indigo-400 font-bold' : 'text-gray-500'}`}>
                                    {hInt}h
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Radar Warning Strip */}
                {data.immediateForecast && data.immediateForecast.length > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                            <Clock className="w-3.5 h-3.5" /> Próximas 3 Horas
                        </h4>
                        <div className="flex flex-col md:flex-row gap-3">
                            {data.immediateForecast.map((fc, idx) => (
                                <div key={idx} className="flex-1 flex justify-between items-center p-2.5 rounded-lg bg-[#0F0F0F] border border-white/5">
                                    <div>
                                        <p className="text-sm font-bold text-white">{fc.hour}</p>
                                        <p className={`text-[10px] uppercase font-bold tracking-widest ${fc.status === 'Lleno' ? 'text-rose-400' :
                                                fc.status === 'Alta' ? 'text-amber-400' :
                                                    fc.status === 'Baja' ? 'text-sky-400' : 'text-emerald-400'
                                            }`}>{fc.status}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400"><span className="text-indigo-400 font-bold">{fc.projectedPax}</span> pax</p>
                                        <p className="text-[9px] text-gray-500">{(fc.reservedPax)} rsv</p>
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

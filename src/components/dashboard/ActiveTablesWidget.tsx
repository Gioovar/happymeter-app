'use client'

import { useState, useEffect } from 'react'
import { BellRing, CheckCircle2, AlertOctagon, Clock, Users, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TableProfile {
    reservationId: string
    tableName: string
    customerName: string
    partySize: number
    elapsedMinutes: number
    expectedDuration: number
    status: 'NORMAL' | 'WARNING' | 'CRITICAL'
    exceededByMinutes: number
    startedAt: string
}

interface ActiveTablesData {
    activeTablesCount: number
    totalActivePax: number
    problematicTablesCount: number
    tables: TableProfile[]
    alerts: TableProfile[]
}

export default function ActiveTablesWidget() {
    const [data, setData] = useState<ActiveTablesData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchMonitor = () => {
            fetch('/api/ai/active-tables-monitor')
                .then(res => res.json())
                .then(resData => {
                    setData(resData)
                    setIsLoading(false)
                })
                .catch(err => {
                    console.error('Failed to fetch active tables monitor:', err)
                    setIsLoading(false)
                })
        }

        fetchMonitor()

        // Real-time polling every 60 seconds
        const interval = setInterval(fetchMonitor, 60000)
        return () => clearInterval(interval)
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

    if (!data || data.activeTablesCount === 0) {
        return (
            <Card className="bg-[#0F0F0F] border-white/5 h-full flex flex-col items-center justify-center p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-4" />
                <p className="text-gray-300 font-bold">Sin Mesas Activas</p>
                <p className="text-xs text-gray-500 mt-2 max-w-[200px]">Las reservaciones en curso aparecerán aquí para monitoreo de tiempos.</p>
            </Card>
        )
    }

    return (
        <Card className={`bg-[#0F0F0F] border-white/5 h-full flex flex-col relative overflow-hidden group transition-all duration-700 ${data.problematicTablesCount > 0 ? 'border-rose-500/20' : ''
            }`}>
            {/* Background Urgent Glow */}
            {data.problematicTablesCount > 0 && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse" />
            )}

            <CardHeader className="pb-3 relative z-10">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                            <BellRing className={`w-5 h-5 ${data.problematicTablesCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
                            Monitor de Mesas
                        </CardTitle>
                        <div className="flex gap-4 mt-2">
                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5" />
                                <span className="font-bold text-white">{data.totalActivePax}</span> sentados
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="font-bold text-white">{data.activeTablesCount}</span> mesas
                            </p>
                        </div>
                    </div>
                    {data.problematicTablesCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 text-xs font-bold border border-rose-500/30">
                            {data.problematicTablesCount} Alertas
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4 relative z-10 flex-1 flex flex-col overflow-y-auto pr-2 custom-scrollbar">

                {data.tables.map((table, idx) => {
                    const isCritical = table.status === 'CRITICAL'
                    const isWarning = table.status === 'WARNING'

                    return (
                        <div key={idx} className={`relative p-3 rounded-xl border transition-all ${isCritical ? 'bg-rose-500/10 border-rose-500/30' :
                            isWarning ? 'bg-amber-500/5 border-amber-500/20' :
                                'bg-white/5 border-white/5'
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className={`font-bold text-sm ${isCritical ? 'text-rose-50' : isWarning ? 'text-amber-50' : 'text-gray-200'}`}>
                                        {table.tableName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{table.customerName} • {table.partySize} pax</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-1.5">
                                        {isCritical && <AlertOctagon className="w-4 h-4 text-rose-500" />}
                                        <span className={`text-sm font-bold ${isCritical ? 'text-rose-400' :
                                            isWarning ? 'text-amber-400' : 'text-emerald-400'
                                            }`}>
                                            {table.elapsedMinutes}m
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">
                                        META: {table.expectedDuration}m
                                    </p>
                                </div>
                            </div>

                            {/* Visual Progress Bar */}
                            <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mt-3 border border-white/5">
                                <div
                                    className={`h-full transition-all duration-1000 ${isCritical ? 'bg-rose-500' :
                                        isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                                        }`}
                                    style={{ width: `${Math.min((table.elapsedMinutes / table.expectedDuration) * 100, 100)}%` }}
                                />
                            </div>

                            {/* Warning Footer details */}
                            {isCritical && (
                                <p className="text-[10px] text-rose-400/80 font-bold mt-2 flex items-center gap-1 bg-rose-500/10 p-1.5 rounded">
                                    <AlertOctagon className="w-3 h-3" />
                                    Excediendo tiempo por {table.exceededByMinutes} minutos. Sugerir cuenta o postre.
                                </p>
                            )}
                        </div>
                    )
                })}

            </CardContent>
        </Card>
    )
}

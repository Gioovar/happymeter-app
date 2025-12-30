'use client'

import { useEffect, useState, useRef } from 'react'
import { Activity, Circle, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

const ActivityFeed = () => {
    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // We use the main stats endpoint which includes logs
                const res = await fetch('/api/admin/stats')
                if (res.ok) {
                    const data = await res.json()
                    if (data.recentLogs) {
                        const mapped = data.recentLogs.map((log: any) => ({
                            type: convertActionToType(log.action),
                            message: `${log.action}: ${log.details || ''}`,
                            time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }))
                        setActivities(mapped)
                    }
                }
            } catch (e) {
                console.error("Failed to load activity feed", e)
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [])

    const convertActionToType = (action: string) => {
        if (action.includes('ERROR') || action.includes('FAILED')) return 'warning'
        if (action.includes('CREATE') || action.includes('SUCCESS') || action.includes('SALE')) return 'success'
        return 'info'
    }

    if (loading) return <div className="h-full bg-[#0F0F0F] animate-pulse rounded-2xl border border-white/5" />

    return (
        <div className="rounded-2xl bg-[#0F0F0F] border border-white/5 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-bold text-gray-300 flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-violet-500" />
                    Actividad en Tiempo Real
                </h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-green-500 font-mono tracking-wider">LIVE</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                <div className="flex flex-col">
                    {activities.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-600">
                            Sin actividad reciente
                        </div>
                    ) : (
                        activities.map((activity, i) => (
                            <div key={i} className="flex gap-3 p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <div className="mt-0.5">
                                    {activity.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500/80" />}
                                    {activity.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500/80" />}
                                    {activity.type === 'info' && <Clock className="w-4 h-4 text-blue-500/80" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-300 leading-relaxed group-hover:text-white transition-colors">
                                        {activity.message}
                                    </p>
                                    <span className="text-[10px] text-gray-600 font-mono mt-1 block">{activity.time}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div className="p-2 border-t border-white/5 text-center">
                <Link href="/admin/logs" className="text-[10px] text-gray-500 hover:text-white transition uppercase font-bold tracking-widest block w-full">
                    Ver Historial Completo
                </Link>
            </div>
        </div>
    )
}

export default ActivityFeed

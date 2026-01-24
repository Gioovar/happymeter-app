
'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Calendar, CheckCircle2, Clock, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function CommissionsPage() {
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/creators/stats')
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error('Failed to fetch commissions', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        )
    }

    const commissions = data?.profile?.commissions || []

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-violet-500/30">
            {/* Header */}


            <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">

                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Historial de Ganancias</h1>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Total Ganado</p>
                        <p className="text-2xl font-bold text-green-400">${data?.stats?.totalCommission?.toFixed(2) || '0.00'} MXN</p>
                    </div>
                </div>

                {commissions.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <DollarSign className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-300">Aún no tienes comisiones</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            Comparte tu enlace de referido para empezar a ganar el 40% de cada suscripción.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {commissions.map((comm: any) => (
                            <div key={comm.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between hover:bg-white/10 transition group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${comm.status === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{comm.description || 'Comisión por referido'}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(comm.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-white group-hover:text-violet-300 transition">+${comm.amount.toFixed(2)} MXN</p>
                                    <div className="flex items-center justify-end gap-1 mt-1">
                                        {comm.status === 'PAID' ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> PAGADO
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                                                <Clock className="w-3 h-3" /> PENDIENTE
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

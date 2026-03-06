'use client'

import { useState, useEffect } from 'react'
import { UserMinus, BellRing, Target, Activity, ShieldAlert, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import FeatureGuard from '@/components/common/FeatureGuard'
import Image from 'next/image'

interface AtRiskCustomer {
    id: string
    name: string
    phone: string
    lastVisit: string
    daysSinceLastVisit: number
    totalVisits: number
    nps: number
    riskLevel: 'HIGH' | 'MEDIUM' // HIGH = Promoter who stopped coming, MEDIUM = Detractor who might not come back
}

export default function RetentionRadarWidget() {
    const [atRiskCustomers, setAtRiskCustomers] = useState<AtRiskCustomer[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchAtRiskCustomers()
    }, [])

    const fetchAtRiskCustomers = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/ai/retention-radar')
            if (res.ok) {
                const data = await res.json()
                setAtRiskCustomers(data)
            }
        } catch (error) {
            console.error('Error fetching retention radar', error)
        } finally {
            setIsLoading(false)
        }
    }

    const sendRescueCampaign = async (customerId: string, customerName: string) => {
        const loadingToast = toast.loading(`Generando mensaje de rescate para ${customerName}...`)
        try {
            // A future endpoint to trigger a quick "Flash Sale" or "We Miss You" SMS to this specific user
            // using the AI Campaign Builder
            await new Promise(r => setTimeout(r, 1500)) // Simulate network
            toast.success(`Campaña de retención enviada a ${customerName}`, { id: loadingToast })
            setAtRiskCustomers(prev => prev.filter(c => c.id !== customerId))
        } catch (error) {
            toast.error('Error al contactar cliente', { id: loadingToast })
        }
    }

    const getRiskStyles = (level: string) => {
        if (level === 'HIGH') return 'bg-red-500/10 border-red-500/30 text-red-400'
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400'
    }

    return (
        <FeatureGuard feature="ai_analytics">
            <div className="flex flex-col h-full rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden shadow-2xl transition-all">

                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <ShieldAlert className="w-5 h-5 text-rose-500 fill-rose-500/20" />
                            Radar de Retención (Churn)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm">
                            La IA detecta clientes leales que han dejado de venir o que tuvieron una mala experiencia reciente.
                        </p>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse h-20 bg-white/5 rounded-2xl"></div>
                            ))}
                        </div>
                    ) : atRiskCustomers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                            <UserMinus className="w-12 h-12 text-gray-700" />
                            <div>
                                <h4 className="font-bold text-gray-300">Retención Óptima</h4>
                                <p className="text-sm text-gray-500 max-w-[250px] mx-auto mt-1">
                                    No hay clientes en riesgo crítico de abandono en este momento.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Clientes en Riesgo ({atRiskCustomers.length})
                                </span>
                            </div>

                            {atRiskCustomers.map(customer => (
                                <div key={customer.id} className="p-4 rounded-2xl bg-[#151515] border border-white/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between group hover:border-white/10 transition-all">

                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center border border-white/5">
                                            <span className="font-bold text-rose-400">{customer.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-white">{customer.name}</h4>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span>Hace {customer.daysSinceLastVisit} días</span>
                                                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {customer.totalVisits} visitas</span>
                                                <span className={`${customer.nps < 7 ? 'text-red-400' : 'text-emerald-400'}`}>NPS: {customer.nps}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getRiskStyles(customer.riskLevel)}`}>
                                            Riesgo {customer.riskLevel === 'HIGH' ? 'Alto' : 'Medio'}
                                        </span>

                                        <button
                                            onClick={() => sendRescueCampaign(customer.id, customer.name)}
                                            className="ml-auto sm:ml-0 p-2 sm:px-4 sm:py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl transition flex items-center gap-2"
                                        >
                                            <BellRing className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Recuperar</span>
                                        </button>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </FeatureGuard>
    )
}

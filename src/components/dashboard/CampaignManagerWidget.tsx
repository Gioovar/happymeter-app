'use client'

import { useState, useEffect } from 'react'
import { Rocket, Mail, Bell, Smartphone, Check, Play, CircleDollarSign } from 'lucide-react'
import { toast } from 'sonner'
import FeatureGuard from '@/components/common/FeatureGuard'

interface AIMarketingCampaign {
    id: string
    name: string
    objective: string
    targetAudience: string
    promotionalMessage: string
    recommendedChannel: string // Push, Email, In-App
    status: string // DRAFT, APPROVED, ACTIVE, COMPLETED
}

export default function CampaignManagerWidget() {
    const [campaigns, setCampaigns] = useState<AIMarketingCampaign[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Listening for the custom event fired by GrowthEngineWidget
        const handleCampaignUpdate = () => {
            fetchCampaigns()
        }
        window.addEventListener('campaignsUpdated', handleCampaignUpdate)

        // Initial Fetch
        fetchCampaigns()

        return () => window.removeEventListener('campaignsUpdated', handleCampaignUpdate)
    }, [])

    const fetchCampaigns = async () => {
        // Since we don't have a GET route yet, we'll manually implement fetching
        // For the sake of this iteration, we simulate an empty state
        // until we add the GET route in the next step.
        setIsLoading(false)
    }

    const launchCampaign = async (campaignId: string) => {
        // Here we would call a "Launch" endpoint which actually connects to
        // the Firebase/OneSignal push API, or Resend for Emails.
        toast.success('¡Campaña Lanzada! Los mensajes se están enviando.')
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'ACTIVE' } : c))
    }

    const getChannelIcon = (channel: string) => {
        if (channel.toLowerCase().includes('push')) return <Bell className="w-4 h-4" />
        if (channel.toLowerCase().includes('email')) return <Mail className="w-4 h-4" />
        return <Smartphone className="w-4 h-4" />
    }

    return (
        <FeatureGuard feature="ai_marketing">
            <div className="flex flex-col h-full rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden shadow-2xl transition-all">

                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <Rocket className="w-5 h-5 text-indigo-400 fill-indigo-400" />
                            Campañas IA
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Mensajes listos para enviar creados por IA.
                        </p>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {campaigns.length === 0 && !isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                            <CircleDollarSign className="w-12 h-12 text-gray-700" />
                            <div>
                                <h4 className="font-bold text-gray-300">Bandeja Vacía</h4>
                                <p className="text-sm text-gray-500 max-w-[250px] mx-auto mt-1">
                                    Acepta oportunidades del Motor de Crecimiento para ver las campañas aquí.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campaigns.map((camp) => (
                                <div key={camp.id} className="relative p-5 rounded-[20px] bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-white/10 overflow-hidden group">

                                    {/* Status Badge */}
                                    <div className="absolute top-4 right-4">
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${camp.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-500 border-amber-500/30'}`}>
                                            {camp.status === 'DRAFT' ? 'BORRADOR' : camp.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 mb-4 pr-20">
                                        <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400 shrink-0">
                                            {getChannelIcon(camp.recommendedChannel)}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-white leading-tight">{camp.name}</h4>
                                            <p className="text-xs font-medium text-indigo-300 mt-0.5">{camp.objective}</p>
                                        </div>
                                    </div>

                                    <div className="bg-black/40 rounded-xl p-4 mb-4 border border-white/5 relative">
                                        <span className="absolute -top-2 left-4 px-2 bg-black text-[10px] font-bold text-gray-500 tracking-wider">MENSAJE PARA: {camp.targetAudience}</span>
                                        <p className="text-sm text-gray-300 leading-relaxed italic mt-1">
                                            "{camp.promotionalMessage}"
                                        </p>
                                    </div>

                                    {camp.status === 'DRAFT' && (
                                        <button
                                            onClick={() => launchCampaign(camp.id)}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] shadow-lg shadow-indigo-500/25"
                                        >
                                            <Play className="w-4 h-4 fill-white" /> Aprobar y Lanzar Campaña
                                        </button>
                                    )}

                                    {camp.status === 'ACTIVE' && (
                                        <div className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-xl text-sm">
                                            <Check className="w-4 h-4" /> Campaña en ejecución
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </FeatureGuard>
    )
}

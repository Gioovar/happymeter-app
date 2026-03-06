'use client'

import { useState, useEffect } from 'react'
import { Zap, Target, Users, Settings, Plus, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import FeatureGuard from '@/components/common/FeatureGuard'

interface AIGrowthOpportunity {
    id: string
    title: string
    description: string
    type: string // "Retention", "Acquisition", "Operations", "Loyalty"
    status: string
}

export default function GrowthEngineWidget() {
    const [opportunities, setOpportunities] = useState<AIGrowthOpportunity[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isGeneratingCampaign, setIsGeneratingCampaign] = useState<string | null>(null)

    useEffect(() => {
        // Here we could fetch existing opportunities from a GET endpoint
        // For now, initializing empty
        setIsLoading(false)
    }, [])

    const runGrowthEngine = async () => {
        setIsGenerating(true)
        const loadingToast = toast.loading('Motor de Crecimiento analizando datos...')
        try {
            const res = await fetch('/api/ai/growth-engine', { method: 'POST' })
            if (res.ok) {
                const newOps = await res.json()
                setOpportunities(newOps)
                toast.success('Oportunidades detectadas', { id: loadingToast })
            } else {
                throw new Error('Failed to run engine')
            }
        } catch (error) {
            toast.error('Error al ejecutar el Motor de Crecimiento', { id: loadingToast })
            console.error(error)
        } finally {
            setIsGenerating(false)
        }
    }

    const generateCampaign = async (opportunityId: string) => {
        setIsGeneratingCampaign(opportunityId)
        const loadingToast = toast.loading('IA construyendo Campaña de Marketing...', { duration: 5000 })

        try {
            const res = await fetch('/api/ai/campaign-builder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opportunityId })
            })

            if (res.ok) {
                // Remove from the list visually since it's ACTIONED
                setOpportunities(prev => prev.filter(op => op.id !== opportunityId))
                toast.success('¡Campaña Creada! Revisa el Gestor de Campañas.', { id: loadingToast })

                // Dispath custom event to notify the CampaignManagerWidget to refresh
                window.dispatchEvent(new Event('campaignsUpdated'))
            } else {
                throw new Error('Failed to generate campaign')
            }
        } catch (error) {
            toast.error('Error al generar la campaña', { id: loadingToast })
            console.error(error)
        } finally {
            setIsGeneratingCampaign(null)
        }
    }

    const getIconForType = (type: string) => {
        switch (type.toLowerCase()) {
            case 'retention': return <Users className="w-5 h-5 text-indigo-400" />
            case 'acquisition': return <Target className="w-5 h-5 text-emerald-400" />
            case 'loyalty': return <Heart className="w-5 h-5 text-pink-400" />
            case 'operations': return <Settings className="w-5 h-5 text-gray-400" />
            default: return <Zap className="w-5 h-5 text-amber-400" />
        }
    }

    const getThemeForType = (type: string) => {
        switch (type.toLowerCase()) {
            case 'retention': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
            case 'acquisition': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            case 'loyalty': return 'bg-pink-500/10 border-pink-500/20 text-pink-300'
            case 'operations': return 'bg-gray-500/10 border-gray-500/20 text-gray-300'
            default: return 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        }
    }

    // Replace missing Heart import with general Zap if needed
    const Heart = Target;

    return (
        <FeatureGuard feature="ai_marketing">
            <div className="flex flex-col h-full rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden shadow-2xl transition-all">

                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <Zap className="w-5 h-5 text-blue-400 fill-blue-400" />
                            Motor de Crecimiento (IA)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Análisis automático de tus datos para detectar oportunidades.
                        </p>
                    </div>
                    <button
                        onClick={runGrowthEngine}
                        disabled={isGenerating}
                        className={`p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition ${isGenerating ? 'animate-spin cursor-not-allowed' : ''}`}
                        title="Buscar Oportunidades Ahora"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {opportunities.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                            <Target className="w-12 h-12 text-gray-700" />
                            <div>
                                <h4 className="font-bold text-gray-300">Todo en Orden</h4>
                                <p className="text-sm text-gray-500 max-w-[250px] mx-auto mt-1">
                                    Ejecuta el Motor para que la IA escanee tu actividad más reciente.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {opportunities.map((op) => (
                                <div key={op.id} className="relative p-5 rounded-2xl bg-[#151515] border border-white/5 group hover:border-white/10 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${getThemeForType(op.type).split(' ').slice(0, 2).join(' ')} shrink-0`}>
                                            {getIconForType(op.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-bold text-white truncate pr-4">{op.title}</h4>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getThemeForType(op.type)}`}>
                                                    {op.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 leading-relaxed max-w-[90%] mb-4">
                                                {op.description}
                                            </p>

                                            {/* Action Button */}
                                            {op.type !== 'Operations' && (
                                                <button
                                                    onClick={() => generateCampaign(op.id)}
                                                    disabled={isGeneratingCampaign === op.id}
                                                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-bold text-xs transition-all ${isGeneratingCampaign === op.id
                                                            ? 'bg-blue-500/20 text-blue-300 cursor-not-allowed'
                                                            : 'bg-white/5 hover:bg-white/10 text-white'
                                                        }`}
                                                >
                                                    {isGeneratingCampaign === op.id ? (
                                                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generando Campaña...</>
                                                    ) : (
                                                        <><Plus className="w-3.5 h-3.5" /> Crear Campaña IA para esto</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dismiss Button */}
                                    <button
                                        onClick={() => setOpportunities(prev => prev.filter(o => o.id !== op.id))}
                                        className="absolute top-4 right-4 text-gray-600 hover:text-white transition opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </FeatureGuard>
    )
}

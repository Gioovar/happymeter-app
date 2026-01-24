'use client'

import { useState, useEffect } from 'react'
import { Download, Info, CheckCircle, TrendingUp, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getCampaignCounts } from '@/actions/campaigns'
import CopyGeneratorModal from './CopyGeneratorModal'

interface CampaignManagerProps {
    selectedSurveyTitle?: string
    selectedSurveyId?: string
}

export default function CampaignManager({ selectedSurveyTitle = 'Todas', selectedSurveyId }: CampaignManagerProps) {
    const [segment, setSegment] = useState<'all' | 'angry' | 'neutral' | 'happy'>('happy') // Default to happy which is usually VIP
    const [isExporting, setIsExporting] = useState(false)
    const [counts, setCounts] = useState({ vip: 0, neutral: 0, angry: 0, promo: 0 })
    const [loadingCounts, setLoadingCounts] = useState(false)
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)

    // Fetch real counts
    useEffect(() => {
        const fetchCounts = async () => {
            setLoadingCounts(true)
            try {
                const data = await getCampaignCounts(selectedSurveyId || 'all')
                setCounts(data || { vip: 0, neutral: 0, angry: 0, promo: 0 })
            } catch (error) {
                console.error("Failed to load counts", error)
                setCounts({ vip: 0, neutral: 0, angry: 0, promo: 0 })
            } finally {
                setLoadingCounts(false)
            }
        }
        fetchCounts()
    }, [selectedSurveyId])

    const handleExport = () => {
        setIsExporting(true)
        // Simulate export - In reality this would hit an API similar to WhatsApp's/vcf
        // For now, we keep the simulation but with a more realistic timeout
        setTimeout(() => {
            setIsExporting(false)
            alert(`Archivo CSV para "${segment.toUpperCase()}" generado. Listo para subir a Meta Ads.`)
        }, 1500)
    }

    const segments = [
        {
            id: 'happy',
            label: 'Lookalike (Satisfechos)',
            desc: 'Crea públicos similares a tus mejores clientes.',
            count: counts.vip,
            color: 'emerald',
            icon: TrendingUp
        },
        {
            id: 'neutral',
            label: 'Re-Engagement (Neutrales)',
            desc: 'Campañas de ofertas para aumentar frecuencia.',
            count: counts.neutral,
            color: 'amber',
            icon: Users
        },
        {
            id: 'angry',
            label: 'Recuperación (Insatisfechos)',
            desc: 'Anuncios de disculpa o incentivos de retorno.',
            count: counts.angry,
            color: 'rose',
            icon: Users
        },
        {
            id: 'all',
            label: 'Audiencia Completa',
            desc: 'Alcance general de marca para todos tus contactos.',
            count: counts.promo,
            color: 'blue',
            icon: Users
        }
    ]

    return (
        <div className="relative group rounded-3xl border border-white/5 bg-[#121212]/50 backdrop-blur-xl overflow-hidden hover:border-violet-500/20 transition duration-500">
            {/* Header Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-80" />

            <div className="p-6 md:p-8 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <div className="text-blue-500 font-bold text-xl">∞</div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                Meta Ads Export
                                <div className="group/tooltip relative">
                                    <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 border border-white/10 text-xs text-gray-300 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition pointer-events-none z-50">
                                        Exporta listas CSV optimizadas para crear "Públicos Personalizados" en Facebook & Instagram Ads Manager.
                                    </div>
                                </div>
                            </h2>
                            <p className="text-sm text-gray-400">Genera audiencias precisas basadas en feedback.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Selector de Segmento */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Selecciona Objetivo</label>
                        <div className="grid grid-cols-1 gap-2">
                            {segments.map((seg) => (
                                <button
                                    key={seg.id}
                                    onClick={() => setSegment(seg.id as any)}
                                    className={`relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 group/btn ${segment === seg.id
                                        ? `bg-${seg.color}-500/10 border-${seg.color}-500/50`
                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg transition-colors ${segment === seg.id ? `bg-${seg.color}-500 text-white` : 'bg-white/5 text-gray-400'}`}>
                                            <seg.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-bold text-sm ${segment === seg.id ? 'text-white' : 'text-gray-300'}`}>{seg.label}</h3>
                                                {segment === seg.id && <CheckCircle className={`w-4 h-4 text-${seg.color}-500`} />}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{seg.desc}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-lg font-bold block ${segment === seg.id ? 'text-white' : 'text-gray-500'}`}>
                                            {loadingCounts ? '...' : seg.count.toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-gray-600 uppercase">Contactos</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Area */}

                    {/* AI Content Generator Button */}
                    <button
                        onClick={() => setIsGeneratorOpen(true)}
                        className="w-full py-3 rounded-xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white transition group/ai flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-violet-500/20 blur-xl group-hover/ai:opacity-50 transition opacity-0" />
                        <Sparkles className="w-4 h-4 text-violet-400 group-hover/ai:text-white transition" />
                        <span className="text-sm font-bold relative z-10">Generar Mensaje con IA para este segmento</span>
                    </button>

                    <div className="bg-[#0f1115] rounded-xl p-6 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Formato de Exportación</span>
                            <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">CSV (Meta Hashed)</span>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={isExporting || (counts[segment === 'happy' ? 'vip' : segment === 'all' ? 'promo' : segment] === 0)}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Procesando...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    <span>Descargar Audiencia {segment.toUpperCase()}</span>
                                </>
                            )}
                        </button>
                    </div>

                    <div className="pt-2 text-center">
                        <Link href="/dashboard/help" className="text-xs text-gray-500 hover:text-gray-300 transition underline decoration-gray-700 underline-offset-4">
                            ¿Cómo cargar mi audiencia en Meta Ads Manager?
                        </Link>
                    </div>
                </div>
            </div>

            <CopyGeneratorModal
                isOpen={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
                segment={segment}
                platform="meta"
                surveyTitle={selectedSurveyTitle}
            />
        </div>
    )
}

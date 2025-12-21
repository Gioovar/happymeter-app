'use client'

import { useState, useEffect } from 'react'
import { Download, MessageCircle, UserPlus, Info, CheckCircle, Smartphone, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { getCampaignCounts } from '@/actions/campaigns'
import CopyGeneratorModal from './CopyGeneratorModal'

interface WhatsAppManagerProps {
    selectedSurveyTitle?: string
    selectedSurveyId?: string
}

export default function WhatsAppManager({ selectedSurveyTitle = 'Todas', selectedSurveyId }: WhatsAppManagerProps) {
    const [segment, setSegment] = useState<'all' | 'vip' | 'promo' | 'angry' | 'neutral'>('vip')
    const [isExporting, setIsExporting] = useState(false)
    const [counts, setCounts] = useState({ vip: 0, neutral: 0, angry: 0, promo: 0 })
    const [loadingCounts, setLoadingCounts] = useState(false)
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false)

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
        const surveyParam = selectedSurveyId || 'all'
        window.location.href = `/api/campaigns/export/vcf?surveyId=${surveyParam}&segment=${segment}`

        setTimeout(() => {
            setIsExporting(false)
        }, 2000)
    }

    const segments = [
        {
            id: 'vip',
            label: 'Clientes VIP',
            desc: 'Para grupos exclusivos y preventas.',
            count: counts.vip,
            color: 'green',
            icon: Users
        },
        {
            id: 'promo',
            label: 'Lista de Difusión',
            desc: 'Para enviar ofertas semanales masivas.',
            count: counts.promo,
            color: 'blue',
            icon: MessageCircle
        },
        {
            id: 'neutral',
            label: 'Seguimiento (Neutrales)',
            desc: 'Encuestas para mejorar satisfacción.',
            count: counts.neutral,
            color: 'yellow',
            icon: Users
        },
        {
            id: 'angry',
            label: 'Soporte (Insatisfechos)',
            desc: 'Atención 1 a 1 para resolver quejas.',
            count: counts.angry,
            color: 'red',
            icon: MessageCircle
        }
    ]

    return (
        <div className="relative group rounded-3xl border border-white/5 bg-[#121212]/50 backdrop-blur-xl overflow-hidden hover:border-green-500/20 transition duration-500">
            {/* Header Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600 opacity-80" />

            <div className="p-6 md:p-8 relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                            <MessageCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                WhatsApp Groups
                                <div className="group/tooltip relative">
                                    <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 border border-white/10 text-xs text-gray-300 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition pointer-events-none z-50">
                                        Gestiona tus comunidades. Crea grupos para clientes VIP o listas de difusión para promociones generales.
                                    </div>
                                </div>
                            </h2>
                            <p className="text-sm text-gray-400">Fideliza clientes directamente en su chat.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Selector de Segmento */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Selecciona Audiencia</label>
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
                        className="w-full py-3 rounded-xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-300 hover:text-white transition group/ai flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-green-500/20 blur-xl group-hover/ai:opacity-50 transition opacity-0" />
                        <Sparkles className="w-4 h-4 text-green-400 group-hover/ai:text-white transition" />
                        <span className="text-sm font-bold relative z-10">Generar Mensaje WhatsApp con IA</span>
                    </button>

                    <div className="bg-[#0f1115] rounded-xl p-6 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Formato de Exportación</span>
                            <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">VCF (Móvil)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                            >
                                {isExporting ? '...' : <><Download className="w-4 h-4" /> Bajar VCF</>}
                            </button>

                            <a
                                href="https://web.whatsapp.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold shadow-lg shadow-green-900/20 transition flex items-center justify-center gap-2 text-sm"
                            >
                                <UserPlus className="w-4 h-4" /> Crear Grupo
                            </a>
                        </div>

                        <div className="bg-white/5 rounded-lg p-3 border border-white/5 text-[11px] text-gray-400 flex gap-2">
                            <Smartphone className="w-4 h-4 text-green-400 shrink-0" />
                            <p>Descarga el archivo VCF y ábrelo en tu celular para guardar todos los contactos automáticamente.</p>
                        </div>
                    </div>
                </div>
            </div>

            <CopyGeneratorModal
                isOpen={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
                segment={segment}
                platform="whatsapp"
                surveyTitle={selectedSurveyTitle}
            />
        </div>
    )
}

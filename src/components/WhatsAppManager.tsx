'use client'

import { useState, useEffect } from 'react'
import { Download, Users, MessageCircle, UserPlus, ExternalLink, Info } from 'lucide-react'
import Link from 'next/link'
import { getCampaignCounts } from '@/actions/campaigns'

interface WhatsAppManagerProps {
    selectedSurveyTitle?: string
    selectedSurveyId?: string
}

export default function WhatsAppManager({ selectedSurveyTitle = 'Todas', selectedSurveyId }: WhatsAppManagerProps) {
    const [segment, setSegment] = useState<'all' | 'vip' | 'promo' | 'angry' | 'neutral'>('vip')
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = () => {
        setIsExporting(true)
        const surveyParam = selectedSurveyId || 'all'
        window.location.href = `/api/campaigns/export/vcf?surveyId=${surveyParam}&segment=${segment}`

        // Restablecer estado después de un breve retraso ya que no podemos rastrear fácilmente la finalización de la descarga
        setTimeout(() => {
            setIsExporting(false)
        }, 2000)
    }

    const [counts, setCounts] = useState({ vip: 0, neutral: 0, angry: 0, promo: 0 })
    const [loadingCounts, setLoadingCounts] = useState(false)

    useEffect(() => {
        const fetchCounts = async () => {
            setLoadingCounts(true)
            try {
                const data = await getCampaignCounts(selectedSurveyId || 'all')
                // Ensure data is not null/undefined
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

    return (
        <div className="relative mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10">
            {/* Decoración de Fondo - Recortada */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <MessageCircle className="w-32 h-32 text-[#25D366]" />
                </div>
            </div>

            <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                        <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            Comunidades de WhatsApp
                            <div className="group relative">
                                <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 border border-white/10 text-xs text-gray-300 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                                    Crea grupos o listas de difusión para mantener a tus clientes informados y fidelizados directamente en su chat.
                                </div>
                            </div>
                        </h2>
                        <p className="text-sm text-gray-400">Crea grupos exclusivos para tus clientes más leales.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Selección de Segmentación */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-300">1. Define tu Grupo</h3>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => setSegment('vip')}
                                className={`flex items-center justify-between p-4 rounded-xl border transition ${segment === 'vip'
                                    ? 'bg-green-500/20 border-green-500 text-white'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${segment === 'vip' ? 'bg-green-500' : 'bg-white/10'}`}>
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold flex items-center gap-2">
                                            Clients VIP (Satisfechos)
                                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{loadingCounts ? '...' : (counts?.vip || 0)}</span>
                                        </p>
                                        <p className="text-xs opacity-70">Para eventos exclusivos y preventas</p>
                                    </div>
                                </div>
                                {segment === 'vip' && <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />}
                            </button>

                            <button
                                onClick={() => setSegment('neutral')}
                                className={`flex items-center justify-between p-4 rounded-xl border transition ${segment === 'neutral'
                                    ? 'bg-yellow-500/20 border-yellow-500 text-white'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${segment === 'neutral' ? 'bg-yellow-500' : 'bg-white/10'}`}>
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold flex items-center gap-2">
                                            Clientes Neutrales
                                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{loadingCounts ? '...' : (counts?.neutral || 0)}</span>
                                        </p>
                                        <p className="text-xs opacity-70">Para encuestas de seguimiento</p>
                                    </div>
                                </div>
                                {segment === 'neutral' && <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_#eab308]" />}
                            </button>

                            <button
                                onClick={() => setSegment('angry')}
                                className={`flex items-center justify-between p-4 rounded-xl border transition ${segment === 'angry'
                                    ? 'bg-red-500/20 border-red-500 text-white'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${segment === 'angry' ? 'bg-red-500' : 'bg-white/10'}`}>
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold flex items-center gap-2">
                                            Clientes Insatisfechos
                                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{loadingCounts ? '...' : (counts?.angry || 0)}</span>
                                        </p>
                                        <p className="text-xs opacity-70">Atención personalizada y soporte</p>
                                    </div>
                                </div>
                                {segment === 'angry' && <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />}
                            </button>

                            <button
                                onClick={() => setSegment('promo')}
                                className={`flex items-center justify-between p-4 rounded-xl border transition ${segment === 'promo'
                                    ? 'bg-blue-500/20 border-blue-500 text-white'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${segment === 'promo' ? 'bg-blue-500' : 'bg-white/10'}`}>
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold flex items-center gap-2">
                                            Lista de Difusión (Ofertas)
                                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{loadingCounts ? '...' : (counts?.promo || 0)}</span>
                                        </p>
                                        <p className="text-xs opacity-70">Para enviar promociones semanales</p>
                                    </div>
                                </div>
                                {segment === 'promo' && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                            </button>
                        </div>
                    </div>

                    {/* Área de Acción */}
                    <div className="flex flex-col justify-between space-y-6">
                        <div className="bg-black/40 rounded-xl p-6 border border-white/10">
                            <h4 className="font-bold mb-2 text-gray-200">Acciones Rápidas</h4>
                            <div className="space-y-3">
                                <button
                                    onClick={handleExport}
                                    disabled={isExporting}
                                    className="w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    {isExporting ? 'Exportando...' : <><Download className="w-4 h-4" /> Descargar Contactos (VCF)</>}
                                </button>

                                <a
                                    href="https://chat.whatsapp.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 text-sm"
                                >
                                    <UserPlus className="w-4 h-4" /> Crear Grupo en WhatsApp Web
                                </a>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-xs text-gray-400">
                            <p className="flex items-start gap-2">
                                <span className="text-green-400 font-bold">Tip:</span>
                                Descarga los contactos en formato VCF para importarlos rápidamente a tu celular y añadirlos al grupo.
                            </p>
                        </div>

                        <Link href="/dashboard/help/whatsapp" className="block">
                            <button className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition text-sm font-medium">
                                ¿Cómo usar WhatsApp Business? Ver guía
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

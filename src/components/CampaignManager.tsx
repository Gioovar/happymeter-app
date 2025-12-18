'use client'

import { useState } from 'react'
import { Download, Users, Frown, Meh, Smile, CheckCircle, Info } from 'lucide-react'
import Link from 'next/link'

interface CampaignManagerProps {
    selectedSurveyTitle?: string
    selectedSurveyId?: string
}

export default function CampaignManager({ selectedSurveyTitle = 'Todas', selectedSurveyId }: CampaignManagerProps) {
    const [segment, setSegment] = useState<'all' | 'angry' | 'neutral' | 'happy'>('angry')
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = () => {
        setIsExporting(true)
        // Simulate API call / file generation
        setTimeout(() => {
            setIsExporting(false)
            alert(`Archivo de audiencia para "${segment.toUpperCase()}" de "${selectedSurveyTitle}" descargado. Listo para subir a Meta Ads.`)
        }, 1500)
    }

    return (
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#1877F2]/10 to-[#E1306C]/10">
            {/* Background Decor - Clipped */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <h1 className="text-9xl font-black tracking-tighter">∞</h1>
                </div>
            </div>

            <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-xs font-bold border-2 border-[#0a0a0a]">f</div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFDC80] via-[#E1306C] to-[#C13584] flex items-center justify-center text-white text-xs font-bold border-2 border-[#0a0a0a]">ig</div>
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold border-2 border-[#0a0a0a]">∞</div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            Campañas Personalizadas Meta
                            <div className="group relative">
                                <Info className="w-4 h-4 text-gray-500 hover:text-white cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 border border-white/10 text-xs text-gray-300 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none z-50">
                                    Exporta listas de clientes segmentadas para crear "Públicos Personalizados" en Facebook e Instagram Ads.
                                </div>
                            </div>
                        </h2>
                        <p className="text-sm text-gray-400">Exporta audiencias segmentadas para Facebook & Instagram Ads.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Segmentation Selection */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-300">1. Selecciona tu Audiencia Objetivo</h3>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => setSegment('angry')}
                                className={`flex items-center justify-between p-4 rounded-xl border transition ${segment === 'angry'
                                    ? 'bg-red-500/20 border-red-500 text-white'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${segment === 'angry' ? 'bg-red-500' : 'bg-white/10'}`}>
                                        <Frown className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold">Clientes Insatisfechos</p>
                                        <p className="text-xs opacity-70">Recuperalos con ofertas de compensación</p>
                                    </div>
                                </div>
                                {segment === 'angry' && <CheckCircle className="w-5 h-5 text-red-500" />}
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
                                        <Meh className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold">Clientes Neutrales</p>
                                        <p className="text-xs opacity-70">Conviértelos en fans con promociones</p>
                                    </div>
                                </div>
                                {segment === 'neutral' && <CheckCircle className="w-5 h-5 text-yellow-500" />}
                            </button>

                            <button
                                onClick={() => setSegment('happy')}
                                className={`flex items-center justify-between p-4 rounded-xl border transition ${segment === 'happy'
                                    ? 'bg-green-500/20 border-green-500 text-white'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${segment === 'happy' ? 'bg-green-500' : 'bg-white/10'}`}>
                                        <Smile className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold">Clientes Satisfechos</p>
                                        <p className="text-xs opacity-70">Pídeles reseñas o programa de lealtad</p>
                                    </div>
                                </div>
                                {segment === 'happy' && <CheckCircle className="w-5 h-5 text-green-500" />}
                            </button>

                            <button
                                onClick={() => setSegment('all')}
                                className={`flex items-center justify-between p-4 rounded-xl border transition ${segment === 'all'
                                    ? 'bg-blue-500/20 border-blue-500 text-white'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${segment === 'all' ? 'bg-blue-500' : 'bg-white/10'}`}>
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold">Todos los Clientes</p>
                                        <p className="text-xs opacity-70">Campaña general de marca</p>
                                    </div>
                                </div>
                                {segment === 'all' && <CheckCircle className="w-5 h-5 text-blue-500" />}
                            </button>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex flex-col justify-between space-y-6">
                        <div className="bg-black/40 rounded-xl p-6 border border-white/10">
                            <h4 className="font-bold mb-2 text-gray-200">Resumen de Audiencia</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Segmento:</span>
                                    <span className="font-medium capitalize">{segment === 'all' ? 'Todos' : segment}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Correos estimados:</span>
                                    <span className="font-medium text-white">
                                        {segment === 'angry' ? '45' : segment === 'neutral' ? '120' : segment === 'happy' ? '850' : '1,015'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Formato:</span>
                                    <span className="font-medium text-blue-400">CSV (Meta Compatible)</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full py-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-lg shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <>
                                    <span className="animate-spin">⏳</span> Generando archivo...
                                </>
                            ) : (
                                <>
                                    <Download className="w-6 h-6" /> Descargar Audiencia
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-500">
                            Sube este archivo directamente a Meta Ads Manager para crear tu "Público Personalizado".
                        </p>

                        <Link href="/dashboard/help" className="block">
                            <button className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition text-sm font-medium">
                                ¿Cómo crear una campaña? Ver guía paso a paso
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

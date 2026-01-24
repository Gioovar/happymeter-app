'use client'

import { Sparkles, Bot, ChevronRight } from 'lucide-react'
import { useState } from 'react'

export default function AIBriefing() {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-sm" />

            <div className="relative rounded-2xl bg-[#0F0F0F] border border-white/10 p-5 overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Bot className="w-24 h-24 text-white rotate-12" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-white text-sm tracking-wide">AI Executive Summary</h3>
                        <span className="ml-auto text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-400">
                            Hoy, 23 Oct
                        </span>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm text-gray-300 leading-relaxed">
                            <span className="text-violet-400 font-bold">Buenos días.</span> Todo opera con normalidad.
                            El tráfico ha aumentado un <span className="text-green-400 font-bold">+12%</span> respecto a ayer.
                            Se detectó una oportunidad de mejora en la sucursal <span className="text-white border-b border-white/20">Zona Norte</span> debido a tiempos de espera.
                        </p>

                        {isExpanded && (
                            <div className="pt-3 border-t border-white/5 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                                    <p className="text-xs text-gray-400">
                                        💡 <strong className="text-white">Recomendación:</strong> Enviar una encuesta flash a los clientes de Zona Norte ofreciendo un descuento en su próxima visita para mitigar el impacto.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-4 text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                    >
                        {isExpanded ? 'Menos detalles' : 'Ver recomendación estratégica'}
                        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    )
}

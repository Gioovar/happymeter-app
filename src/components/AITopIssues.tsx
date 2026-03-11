
'use client'

import { useState } from 'react'
import { Zap, AlertTriangle, CheckCircle, BrainCircuit, Loader2 } from 'lucide-react'

interface Issue {
    title: string
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    percentage: number
    summary: string
    recommendation: string
    ticketId?: string | null
}

interface MarketingRecommendation {
    title: string
    strategy: string
    platform: string
}

interface Strength {
    title: string
    summary: string
}

export default function AITopIssues() {
    const [isLoading, setIsLoading] = useState(false)
    const [issues, setIssues] = useState<Issue[] | null>(null)
    const [strengths, setStrengths] = useState<Strength[] | null>(null)
    const [marketingRec, setMarketingRec] = useState<MarketingRecommendation | null>(null)
    const [hasAnalyzed, setHasAnalyzed] = useState(false)

    const handleAnalyze = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/analytics/ai-issues', { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                setIssues(data.issues)
                setStrengths(data.strengths || [])
                setMarketingRec(data.marketing_recommendation)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
            setHasAnalyzed(true)
        }
    }

    if (!hasAnalyzed) {
        return (
            <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center p-6 bg-white/5 rounded-xl border border-white/5 group hover:border-violet-500/30 transition-all cursor-pointer" onClick={handleAnalyze}>
                {isLoading ? (
                    <div className="flex flex-col items-center animate-pulse">
                        <BrainCircuit className="w-12 h-12 text-violet-400 mb-4 animate-spin-slow" />
                        <h3 className="text-white font-bold text-lg">Analizando Feedback...</h3>
                        <p className="text-gray-400 text-sm mt-2">Nuestra IA está leyendo los comentarios...</p>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition duration-300">
                            <BrainCircuit className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="text-white font-bold text-lg mb-2">Análisis de IA</h3>
                        <p className="text-gray-400 text-sm mb-4 max-w-[200px]">
                            Detecta automáticamente los problemas más recurrentes usando Inteligencia Artificial.
                        </p>
                        <button
                            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                        >
                            <Zap className="w-4 h-4 fill-white" />
                            Analizar Ahora
                        </button>
                    </>
                )}
            </div>
        )
    }

    if (issues && issues.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-white font-bold">Todo excelente</h3>
                <p className="text-gray-400 text-sm">No encontramos problemas recurrentes graves.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Marketing Recommendation Card (Top Highlight) */}
            {marketingRec && (
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-5 relative overflow-hidden group shadow-lg mb-4">
                    {/* Decorative bolt */}
                    <div className="absolute top-0 right-0 p-3 opacity-20 rotate-12 group-hover:rotate-45 transition duration-500">
                        <Zap className="w-24 h-24 text-white" />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <BrainCircuit className="w-4 h-4 text-violet-200" />
                            <span className="font-bold text-xs uppercase tracking-wider text-violet-100 opacity-90">IMPULSO EN {marketingRec.platform.toUpperCase()}</span>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                            {marketingRec.platform}
                        </h3>

                        <p className="text-base text-violet-50 font-medium leading-relaxed max-w-[90%]">
                            "{marketingRec.strategy}"
                        </p>
                    </div>
                </div>
            )}

            {/* Issues List - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {issues?.map((issue, idx) => (
                    <div key={idx} className="bg-[#1a1a1a] rounded-xl p-4 border-l-[6px] border-[#1a1a1a] hover:bg-[#202020] transition group flex flex-col gap-3"
                        style={{
                            borderLeftColor: issue.severity === 'HIGH' ? '#ef4444' : issue.severity === 'MEDIUM' ? '#f59e0b' : '#22c55e'
                        }}
                    >
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-2 gap-2">
                                <h4 className="font-bold text-white text-base leading-tight">
                                    {issue.title}
                                    {issue.ticketId ? (
                                        <span className="block mt-1 w-max bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-red-500/30">
                                            Recurrente
                                        </span>
                                    ) : (
                                        <span className="block mt-1 w-max bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-500/30">
                                            Nuevo
                                        </span>
                                    )}
                                </h4>
                                <span className={`shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${issue.severity === 'HIGH' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                    issue.severity === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                        'bg-green-500/10 border-green-500/20 text-green-500'
                                    }`}>
                                    {issue.severity === 'HIGH' ? 'ALTA' : issue.severity === 'MEDIUM' ? 'MEDIA' : 'BAJA'}
                                </span>
                            </div>

                            <p className="text-gray-400 text-sm mb-4 leading-snug">{issue.summary}</p>

                            <div className="flex items-start gap-3 p-3 bg-black/40 rounded-lg border border-white/5">
                                <Zap className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-gray-300 text-xs italic font-medium">"{issue.recommendation}"</p>
                            </div>
                        </div>

                        {/* Smart Smart Ticket Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-1">
                            {issue.ticketId ? (
                                <>
                                    <button
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            btn.innerHTML = "Marcando...";
                                            await fetch(`/api/issues/${issue.ticketId}`, {
                                                method: 'PATCH',
                                                body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: 'Resuelto por el gerente desde Análisis UI.' })
                                            });
                                            btn.innerHTML = "¡Resuelto!";
                                            btn.className = "w-full mt-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded-md text-xs font-bold transition";
                                        }}
                                        className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-md text-xs font-bold transition">
                                        Marcar como Resuelto
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            btn.innerHTML = "Creando...";
                                            await fetch('/api/issues', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    title: issue.title,
                                                    description: issue.summary,
                                                    severity: issue.severity,
                                                    aiSummary: issue.recommendation
                                                })
                                            });
                                            btn.innerHTML = "Ticket Creado";
                                            btn.className = "w-full mt-2 bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 px-3 py-1.5 rounded-md text-xs font-bold transition";
                                        }}
                                        className="w-full mt-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition">
                                        Crear Ticket de Seguimiento
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Strengths Section */}
            {strengths && strengths.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-bold text-green-400 uppercase mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Fortalezas Detectadas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {strengths.map((strength, idx) => (
                            <div key={idx} className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 h-full">
                                <h5 className="text-green-300 font-bold text-xs mb-1">{strength.title}</h5>
                                <p className="text-green-400/80 text-[10px] italic">"{strength.summary}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="text-center mt-2">
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="text-xs text-violet-400 hover:text-white transition flex items-center justify-center gap-1 w-full opacity-50 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Loader2 className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Analizando...' : 'Re-analizar'}
                </button>
            </div>
        </div>
    )
}


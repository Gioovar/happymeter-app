
'use client'

import { useState } from 'react'
import { Zap, AlertTriangle, CheckCircle, BrainCircuit, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-[#0a0a0a]/50 backdrop-blur-sm rounded-[24px] border border-white/5 relative overflow-hidden group cursor-pointer"
                onClick={handleAnalyze}
            >
                {/* Background glow effects */}
                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-violet-600/20 blur-[60px] rounded-full pointer-events-none group-hover:bg-violet-600/30 transition-all duration-700" />

                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center relative z-10"
                    >
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-xl animate-pulse" />
                            <BrainCircuit className="w-16 h-16 text-violet-400 animate-[spin_3s_linear_infinite]" />
                        </div>
                        <h3 className="text-white font-black text-2xl tracking-tight mb-2">Escaneando Inteligencia Analítica...</h3>
                        <p className="text-violet-200/60 font-medium">Procesando miles de variables en segundos.</p>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center relative z-10"
                    >
                        <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(139,92,246,0.15)] group-hover:scale-110 group-hover:shadow-[0_0_50px_rgba(139,92,246,0.3)] transition-all duration-500">
                            <BrainCircuit className="w-10 h-10 text-violet-400 group-hover:text-fuchsia-400 transition-colors duration-500" />
                        </div>
                        <h3 className="text-white font-black text-2xl tracking-tight mb-3">Diagnóstico Profundo (IA)</h3>
                        <p className="text-gray-400 text-[15px] mb-8 max-w-[340px] leading-relaxed font-medium">
                            Nuestra Inteligencia Artificial escanea cada reseña para identificar los <span className="text-violet-300">patrones críticos</span> ocultos en tu operación.
                        </p>
                        <button
                            className="relative overflow-hidden group/btn bg-white text-black px-8 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                        >
                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-200 via-white to-violet-200 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                            <Zap className="w-4 h-4 fill-black relative z-10" />
                            <span className="relative z-10">Iniciar Diagnóstico</span>
                        </button>
                    </motion.div>
                )}
            </motion.div>
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pt-2"
            >
                <AnimatePresence>
                    {issues?.map((issue, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, delay: idx * 0.1, ease: "easeOut" }}
                            className="bg-[#111111]/80 backdrop-blur-xl rounded-[20px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/5 hover:border-white/10 hover:shadow-violet-900/10 hover:-translate-y-1 transition-all group flex flex-col gap-4 relative overflow-hidden"
                        >
                            {/* Colorful animated side gradient based on severity */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 opacity-70 group-hover:opacity-100 transition-opacity`}
                                style={{
                                    background: issue.severity === 'HIGH' ? 'linear-gradient(to bottom, #ef4444, transparent)' :
                                        issue.severity === 'MEDIUM' ? 'linear-gradient(to bottom, #f59e0b, transparent)' :
                                            'linear-gradient(to bottom, #22c55e, transparent)'
                                }}
                            />
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

                                <p className="text-gray-400 text-[13px] mb-4 leading-relaxed font-medium">{issue.summary}</p>

                                <div className="flex items-start gap-3 p-3.5 bg-black/60 rounded-xl border border-white/5 group-hover:bg-violet-900/10 transition-colors">
                                    <Zap className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                                    <p className="text-gray-300 text-xs italic font-semibold leading-relaxed">"{issue.recommendation}"</p>
                                </div>
                            </div>

                            {/* Smart Ticket Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                                {issue.ticketId ? (
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
                                            btn.className = "w-full bg-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-bold transition";
                                        }}
                                        className="w-full bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2">
                                        <CheckCircle className="w-3.5 h-3.5" /> Marcar Resuelto
                                    </button>
                                ) : (
                                    <button
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.disabled = true;
                                            btn.innerHTML = "Creando Ticket...";
                                            await fetch('/api/issues', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    title: issue.title,
                                                    description: issue.summary,
                                                    severity: issue.severity,
                                                    aiSummary: issue.recommendation
                                                })
                                            });
                                            btn.innerHTML = "¡Ticket Creado!";
                                            btn.className = "w-full bg-violet-500/20 text-violet-400 px-4 py-2.5 rounded-xl text-xs font-bold transition";
                                        }}
                                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition">
                                        Generar Acción (Smart Ticket)
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

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

            <div className="text-center mt-6">
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="group relative inline-flex items-center justify-center px-6 py-2.5 bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-violet-500/10 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-violet-600/0 via-violet-600/10 to-violet-600/0 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                    <span className="relative flex items-center gap-2 text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                        <Loader2 className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-violet-400' : 'group-hover:text-violet-400 transition-colors'}`} />
                        {isLoading ? 'Analizando en vivo...' : 'Forzar Nuevo Análisis IA'}
                    </span>
                </button>
            </div>
        </div>
    )
}


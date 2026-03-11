'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Clock, Check, X, Info, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import FeatureGuard from '@/components/common/FeatureGuard'
import { AnimatePresence, motion } from 'framer-motion'

interface ResolvedIssue {
    id: string
    issueSummary: string
    originalContext: string | null
    status: string // RESOLVED, IGNORED
    createdAt: string
}

export default function ResolvedIssuesWidget() {
    const [issues, setIssues] = useState<ResolvedIssue[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showInfo, setShowInfo] = useState(false)

    interface ActiveIncident {
        id: string
        title: string | null
        aiSummary: string | null
        aiContext: string | null
        createdAt: string
    }

    const [activeIncidents, setActiveIncidents] = useState<ActiveIncident[]>([])

    useEffect(() => {
        fetchResolvedIssues()
        fetchActiveIncidents()
    }, [])

    const fetchActiveIncidents = async () => {
        try {
            const res = await fetch('/api/ai/active-incidents')
            if (res.ok) {
                const data = await res.json()
                setActiveIncidents(data)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const fetchResolvedIssues = async () => {
        try {
            const res = await fetch('/api/ai/resolved-issues')
            if (res.ok) {
                const data = await res.json()
                setIssues(data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const markAsResolved = async (incidentId: string, summary: string, context: string) => {
        const loadingId = toast.loading('Guardando en la Memoria Dinámica...')
        try {
            const res = await fetch('/api/ai/resolved-issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    issueSummary: summary,
                    originalContext: context,
                    status: 'RESOLVED'
                })
            })

            if (res.ok) {
                const newResolved = await res.json()
                // Remove from active
                setActiveIncidents(prev => prev.filter(i => i.id !== incidentId))
                // Add to history
                setIssues(prev => [newResolved, ...prev])
                toast.success('Incidente solucionado. La IA no volverá a reportarlo.', { id: loadingId })
            }
        } catch (error) {
            toast.error('Error al guardar.', { id: loadingId })
        }
    }

    return (
        <FeatureGuard feature="ai_analytics">
            <div className="flex flex-col h-full rounded-[32px] bg-[#0A0A0A] border border-white/5 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-all group relative">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 group-hover:bg-amber-500/10 transition-all duration-700" />

                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white/90">
                            <div className="p-1.5 rounded-lg bg-amber-500/10">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </div>
                            Memoria Dinámica (IA)
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Resuelve problemas para entrenar la Memoria Dinámica de la IA.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition group/btn relative shrink-0"
                        title="¿Cómo funciona?"
                    >
                        <Info className="w-4 h-4 text-indigo-400" />
                        <span className="absolute -top-8 right-0 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition whitespace-nowrap pointer-events-none z-50">
                            ¿Cómo funciona?
                        </span>
                    </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-6">

                    {/* Active Incidents */}
                    <div className="relative">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Detectados Ahora
                        </h4>

                        <AnimatePresence mode="popLayout">
                            {activeIncidents.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-6 rounded-[20px] border border-dashed border-white/10 bg-white/[0.01] text-center flex flex-col items-center justify-center min-h-[160px]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-300">Todo en orden operativo</p>
                                    <p className="text-xs text-gray-500 mt-1">La IA no detecta incidentes activos críticos.</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-4"
                                >
                                    {activeIncidents.map((incident, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={incident.id}
                                            className="p-5 rounded-[20px] bg-gradient-to-br from-[#1a1510] to-[#120f0a] border border-amber-500/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden group"
                                        >
                                            {/* Decorative amber glow */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />

                                            <div className="relative z-10">
                                                <h5 className="font-bold text-amber-500 text-sm mb-2 text-balance leading-snug">{incident.aiSummary || incident.title || 'Incidente no especificado'}</h5>
                                                <p className="text-[13px] text-amber-200/50 mb-4 leading-relaxed font-medium line-clamp-2 group-hover:line-clamp-none transition-all duration-300">{incident.aiContext}</p>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => markAsResolved(incident.id, incident.aiSummary || 'Incidente', incident.aiContext || '')}
                                                        className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black font-bold text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-amber-500/20 hover:border-transparent"
                                                    >
                                                        <Check className="w-4 h-4" /> Ya lo solucioné en sitio
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Dynamic Memory History */}
                    <div className="mt-8">
                        <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center justify-between border-t border-white/5 pt-6">
                            Memoria Dinámica (Aprendizaje IA)
                            <span className="bg-white/5 border border-white/10 text-gray-400 px-2.5 py-1 rounded-full text-[10px] font-mono">{issues.length}</span>
                        </h4>

                        <AnimatePresence>
                            {isLoading ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse"></div>
                                    ))}
                                </motion.div>
                            ) : issues.length === 0 ? (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-gray-600 italic text-center py-4">No hay historial de incidentes solucionados.</motion.p>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-3"
                                >
                                    {issues.slice(0, 5).map((issue, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={issue.id}
                                            className="flex items-start gap-3 p-4 rounded-2xl border border-white/5 bg-[#121212] hover:bg-[#151515] transition-colors group"
                                        >
                                            <div className="p-1.5 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors shrink-0 mt-0.5">
                                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-[13px] text-gray-300 font-medium line-clamp-2 leading-relaxed">{issue.issueSummary}</p>
                                                <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 mt-2">
                                                    <Clock className="w-3.5 h-3.5 opacity-70" />
                                                    Resuelto el {new Date(issue.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

                {/* AI Explanation Modal */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                            onClick={() => setShowInfo(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, y: 10 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.95, y: 10 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-[#111] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[85vh] custom-scrollbar"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Sparkles className="w-6 h-6 text-indigo-400" />
                                        ¿Cómo funciona la IA?
                                    </h3>
                                    <button onClick={() => setShowInfo(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                                    <p>
                                        Este widget de <strong className="text-amber-400">Incidentes Operativos</strong> analiza todas las encuestas y alertas recibidas para detectar automáticamente quejas críticas.
                                    </p>

                                    <ul className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/5">
                                        <li><strong className="text-white">Identificación Oculta:</strong> La IA puede detectar problemas reales en los comentarios (comida fría, servicio lento), incluso si el cliente dejó una calificación numérica alta (ej. 5 estrellas).</li>
                                        <li><strong className="text-white">Panel Interactivo:</strong> Los problemas se colocan aquí como <i>Incidentes Activos</i>. Un humano debe leerlos y darle click a "Ya lo solucioné" una vez que el problema operativo fue arreglado en el restaurante.</li>
                                        <li><strong className="text-white">Memoria Dinámica:</strong> Al solucionarlo, la IA lo guarda en su memoria profunda para no volver a alertarte sobre la misma queja ya resuelta, ajustando así su entendimiento de tu negocio.</li>
                                    </ul>
                                </div>

                                <button onClick={() => setShowInfo(false)} className="w-full py-3 mt-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition">
                                    Entendido
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </FeatureGuard>
    )
}

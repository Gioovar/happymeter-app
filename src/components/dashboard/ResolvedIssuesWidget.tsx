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
            <div className="flex flex-col h-full rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden shadow-2xl transition-all">

                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <AlertTriangle className="w-5 h-5 text-amber-500 fill-amber-500/20" />
                            Incidentes de Operación (IA)
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
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Detectados Ahora</h4>
                        {activeIncidents.length === 0 ? (
                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                                <p className="text-xs text-gray-400">Todo en orden. No hay incidentes activos.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeIncidents.map(incident => (
                                    <div key={incident.id} className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <h5 className="font-bold text-amber-400 text-sm mb-1">{incident.aiSummary || incident.title || 'Incidente no especificado'}</h5>
                                        <p className="text-xs text-amber-200/60 mb-3">{incident.aiContext}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => markAsResolved(incident.id, incident.aiSummary || 'Incidente', incident.aiContext || '')}
                                                className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg transition"
                                            >
                                                <Check className="w-3 h-3 inline mr-1" /> Ya lo solucioné
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dynamic Memory History */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                            Memoria Dinámica (Ignorados)
                            <span className="bg-white/10 text-gray-400 px-2 py-0.5 rounded-full text-[10px]">{issues.length}</span>
                        </h4>

                        {isLoading ? (
                            <div className="animate-pulse h-12 bg-white/5 rounded-xl"></div>
                        ) : issues.length === 0 ? (
                            <p className="text-xs text-gray-600 italic">No hay historial de incidentes solucionados.</p>
                        ) : (
                            <div className="space-y-2">
                                {issues.slice(0, 5).map(issue => (
                                    <div key={issue.id} className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-[#151515]">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-300 font-medium line-clamp-1">{issue.issueSummary}</p>
                                            <p className="text-[10px] text-gray-600 flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" />
                                                Resuelto el {new Date(issue.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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

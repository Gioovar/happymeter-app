'use client'

import { useState, useEffect } from 'react'
import { Star, TrendingUp, TrendingDown, Minus, RefreshCw, Info, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import FeatureGuard from '@/components/common/FeatureGuard'
import { AnimatePresence, motion } from 'framer-motion'

interface ReputationScore {
    id: string
    businessId: string
    generalScore: number
    serviceScore: number
    foodScore: number
    ambianceScore: number
    cleanlinessScore: number
    speedScore: number
    trend: string
    createdAt: string
}

export default function ReputationWidget() {
    const [latestReputation, setLatestReputation] = useState<ReputationScore | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isCalculating, setIsCalculating] = useState(false)
    const [showInfo, setShowInfo] = useState(false)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            // For now, we will just call the generation endpoint to get the latest if we don't have a history endpoint yet
            // In a real app we would have a /api/ai/reputation-history GET endpoint.
            // But since this is new, we will just let it be empty until they calculate. 
            // We can try to fetch the latest from the DB directly if we build a GET route later.
            setIsLoading(false)
        } catch (error) {
            console.error('Error fetching reputation history:', error)
            setIsLoading(false)
        }
    }

    const calculateReputation = async () => {
        setIsCalculating(true)
        const loadingToast = toast.loading('Analizando opiniones con IA...')
        try {
            const res = await fetch('/api/ai/reputation', { method: 'POST' })
            if (res.ok) {
                const newScore = await res.json()
                setLatestReputation(newScore)
                toast.success('Reputación analizada correctamente', { id: loadingToast })
            } else {
                throw new Error('Failed to calculate')
            }
        } catch (error) {
            toast.error('Error al analizar la reputación. Necesitamos más respuestas recientes.', { id: loadingToast })
            console.error(error)
        } finally {
            setIsCalculating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="w-full h-[300px] rounded-3xl bg-[#0F0F0F] border border-white/5 animate-pulse flex items-center justify-center">
                <Star className="w-8 h-8 text-gray-600" />
            </div>
        )
    }

    const getTrendIcon = (trend: string) => {
        if (trend === 'Up') return <TrendingUp className="w-4 h-4 text-emerald-400" />
        if (trend === 'Down') return <TrendingDown className="w-4 h-4 text-red-400" />
        return <Minus className="w-4 h-4 text-amber-400" />
    }

    const renderStars = (score: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`}
                    />
                ))}
                <span className="text-white text-xs font-bold ml-1">{score.toFixed(1)}</span>
            </div>
        )
    }

    return (
        <FeatureGuard feature="ai_analytics">
            <div className="relative p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden shadow-2xl transition-all h-full flex flex-col justify-between">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        Reputación (IA)
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowInfo(true)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition group/btn relative"
                            title="¿Cómo funciona?"
                        >
                            <Info className="w-4 h-4 text-indigo-400" />
                            <span className="absolute -top-8 right-0 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 transition whitespace-nowrap pointer-events-none">
                                ¿Cómo funciona?
                            </span>
                        </button>
                        <button
                            onClick={calculateReputation}
                            disabled={isCalculating}
                            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition ${isCalculating ? 'animate-spin cursor-not-allowed' : ''}`}
                            title="Analizar Reputación"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {!latestReputation ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                        <Star className="w-12 h-12 text-gray-600 mb-2" />
                        <div>
                            <h4 className="font-bold text-gray-300">Sin Datos Recientes</h4>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                                Pídele a la IA que lea todas tus encuestas y extraiga tu reputación real.
                            </p>
                        </div>
                        <button
                            onClick={calculateReputation}
                            disabled={isCalculating}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg text-sm hover:scale-105 transition shadow-lg shadow-amber-500/20"
                        >
                            {isCalculating ? 'Analizando...' : 'Extraer Reputación'}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* Big General Score */}
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-sm text-gray-400 font-medium mb-1">Satisfacción General</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-5xl font-extrabold tracking-tighter text-white">
                                        {latestReputation.generalScore.toFixed(1)}
                                    </span>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} className={`w-4 h-4 ${star <= Math.round(latestReputation.generalScore) ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`} />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                                            Tendencia: {getTrendIcon(latestReputation.trend)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Servicio</p>
                                {renderStars(latestReputation.serviceScore)}
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Comida</p>
                                {renderStars(latestReputation.foodScore)}
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Ambiente</p>
                                {renderStars(latestReputation.ambianceScore)}
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Limpieza</p>
                                {renderStars(latestReputation.cleanlinessScore)}
                            </div>
                            <div className="space-y-1 col-span-2">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Atención</p>
                                {renderStars(latestReputation.speedScore)}
                            </div>
                        </div>
                    </div>
                )}

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
                                        El widget de <strong className="text-amber-400">Reputación</strong> evalúa automáticamente la calidad de tu servicio basándose en los sentimientos expresados en las encuestas de clientes de los últimos 30 días.
                                    </p>

                                    <ul className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/5">
                                        <li><strong className="text-white">Lectura Semántica:</strong> La IA lee y comprende el contexto real de los comentarios abiertos, determinando si son quejas, elogios o sugerencias.</li>
                                        <li><strong className="text-white">Métricas Específicas:</strong> Calcula promedios para categorías como Servicio, Comida, Ambiente, Limpieza y Atención.</li>
                                        <li><strong className="text-white">Tendencia:</strong> Determina automáticamente la línea de tendencia de tu negocio (si está subiendo, bajando, o se mantiene estable en el mes actual).</li>
                                    </ul>

                                    <p className="text-xs text-gray-500 italic mt-2">
                                        * La puntuación general se ajusta inteligentemente de forma ponderada y evita que opiniones destructivas aisladas hundan por completo la calificación.
                                    </p>
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

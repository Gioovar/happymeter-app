'use client'

import { useState, useEffect } from 'react'
import { Activity, HeartPulse, RefreshCw, AlertTriangle, CheckCircle, Search, Info } from 'lucide-react'
import { toast } from 'sonner'
import LaserBorder from '@/components/ui/LaserBorder'
import FeatureGuard from '@/components/common/FeatureGuard'

interface HealthScore {
    id: string
    businessId: string
    score: number
    status: string
    customerExperienceScore: number
    serviceQualityScore: number
    internalOpsScore: number
    businessActivityScore: number
    loyaltyScore: number
    aiExplanation: string
    aiRecommendations: { title: string, action: string }[]
    createdAt: string
}

export default function RestaurantHealthWidget() {
    const [latestScore, setLatestScore] = useState<HealthScore | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isCalculating, setIsCalculating] = useState(false)
    const [showDetails, setShowDetails] = useState(false)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/analytics/health-history?days=7')
            if (res.ok) {
                const data = await res.json()
                if (data && data.length > 0) {
                    setLatestScore(data[data.length - 1]) // Get latest
                }
            }
        } catch (error) {
            console.error('Error fetching health history:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const calculateNewScore = async () => {
        setIsCalculating(true)
        const loadingToast = toast.loading('Calculando Índice de Salud con IA...')
        try {
            const res = await fetch('/api/analytics/health-index', { method: 'POST' })
            if (res.ok) {
                const newScore = await res.json()
                setLatestScore(newScore)
                toast.success('Índice actualizado correctamente', { id: loadingToast })
            } else {
                throw new Error('Failed to calculate')
            }
        } catch (error) {
            toast.error('Error al calcular el índice.', { id: loadingToast })
            console.error(error)
        } finally {
            setIsCalculating(false)
        }
    }

    if (isLoading) {
        return (
            <div className="w-full h-[300px] rounded-3xl bg-[#0F0F0F] border border-white/5 animate-pulse flex items-center justify-center">
                <HeartPulse className="w-8 h-8 text-gray-600" />
            </div>
        )
    }

    // Color Logic
    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-emerald-400'
        if (score >= 75) return 'text-green-400'
        if (score >= 60) return 'text-yellow-400'
        if (score >= 40) return 'text-orange-400'
        return 'text-red-500'
    }

    const getScoreGradient = (score: number) => {
        if (score >= 90) return 'from-emerald-500 to-green-500'
        if (score >= 75) return 'from-green-500 to-emerald-400'
        if (score >= 60) return 'from-yellow-400 to-amber-500'
        if (score >= 40) return 'from-orange-500 to-red-400'
        return 'from-red-600 to-red-500'
    }

    const getStatusIcon = (status: string) => {
        if (status.includes('Excelente') || status.includes('Saludable')) return <CheckCircle className="w-5 h-5" />
        if (status.includes('Atención') || status.includes('Problemas')) return <AlertTriangle className="w-5 h-5" />
        return <Activity className="w-5 h-5" />
    }

    return (
        <FeatureGuard feature="ai_analytics">
            <div className="group relative p-1 rounded-3xl bg-[#0F0F0F] border border-white/5 overflow-hidden shadow-2xl transition-all h-full">
                {/* Visual Glow behind */}
                {latestScore && (
                    <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${getScoreGradient(latestScore.score)} opacity-5 blur-[80px] rounded-full pointer-events-none`} />
                )}

                <div className="relative z-10 bg-[#0a0a0a] rounded-[20px] p-6 h-full flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                            <HeartPulse className="w-6 h-6 text-pink-500" />
                            Salud del Restaurante (RHI)
                        </h3>
                        <button
                            onClick={calculateNewScore}
                            disabled={isCalculating}
                            className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition ${isCalculating ? 'animate-spin cursor-not-allowed' : ''}`}
                            title="Recalcular con IA"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {!latestScore ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                            <Activity className="w-12 h-12 text-gray-600 mb-2" />
                            <div>
                                <h4 className="font-bold text-gray-300">Aún no hay datos</h4>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                                    Calcula tu primer índice para ver cómo está operando tu restaurante basado en IA.
                                </p>
                            </div>
                            <button
                                onClick={calculateNewScore}
                                disabled={isCalculating}
                                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white font-bold rounded-lg text-sm hover:scale-105 transition shadow-lg shadow-pink-500/20"
                            >
                                {isCalculating ? 'Analizando...' : 'Calcular Índice Ahora'}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Score Display Area */}
                            <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
                                {/* Big Score */}
                                <div className="relative flex flex-col items-center justify-center w-36 h-36 rounded-full border-4 border-white/5 bg-black/50 shrink-0">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                                        <circle
                                            cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="4"
                                            strokeDasharray={`${(latestScore.score / 100) * 289} 289`}
                                            className={`${getScoreColor(latestScore.score)} transition-all duration-1000 ease-out drop-shadow-lg`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className={`text-4xl font-extrabold ${getScoreColor(latestScore.score)} tracking-tighter`}>
                                        {latestScore.score}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1">/ 100</span>
                                </div>

                                {/* Status & Sub-scores */}
                                <div className="flex-1 w-full space-y-4">
                                    <div>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border ${getScoreColor(latestScore.score).replace('text-', 'border-').replace('400', '500/30')} ${getScoreColor(latestScore.score).replace('text-', 'bg-').replace('400', '500/10')} ${getScoreColor(latestScore.score)}`}>
                                            {getStatusIcon(latestScore.status)} {latestScore.status}
                                        </div>
                                        <p className="text-sm text-gray-400 italic line-clamp-2" title={latestScore.aiExplanation}>
                                            "{latestScore.aiExplanation}"
                                        </p>
                                    </div>

                                    {/* Breakdown Bars */}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                                        <ScoreBar label="Experiencia Cte." score={latestScore.customerExperienceScore} />
                                        <ScoreBar label="Calidad Servicio" score={latestScore.serviceQualityScore} />
                                        <ScoreBar label="Ops Internas" score={latestScore.internalOpsScore} />
                                        <ScoreBar label="Actividad Negocio" score={latestScore.businessActivityScore} />
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations Toggle */}
                            <div className="border-t border-white/5 pt-4">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="w-full flex justify-between items-center text-xs font-bold text-gray-400 hover:text-white transition group"
                                >
                                    <span className="flex items-center gap-1">
                                        <Search className="w-3.5 h-3.5" />
                                        {showDetails ? 'Ocultar Análisis IA' : 'Ver Análisis y Recomendaciones IA'}
                                    </span>
                                    <span>{showDetails ? '↑' : '↓'}</span>
                                </button>

                                {showDetails && (
                                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-sm text-gray-300 leading-relaxed">
                                            {latestScore.aiExplanation}
                                        </div>
                                        <div className="space-y-2">
                                            {latestScore.aiRecommendations?.map((rec: any, idx) => (
                                                <div key={idx} className="flex gap-3 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl items-start">
                                                    <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-0.5">{rec.title}</h5>
                                                        <p className="text-xs text-indigo-100/80">{rec.action}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </FeatureGuard>
    )
}

function ScoreBar({ label, score }: { label: string, score: number }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500">
                <span>{label}</span>
                <span className={score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}>{score}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                />
            </div>
        </div>
    )
}

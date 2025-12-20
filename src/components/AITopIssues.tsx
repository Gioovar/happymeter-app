
'use client'

import { useState } from 'react'
import { Zap, AlertTriangle, CheckCircle, BrainCircuit, Loader2 } from 'lucide-react'

interface Issue {
    title: string
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    percentage: number
    summary: string
    recommendation: string
}

interface MarketingRecommendation {
    title: string
    strategy: string
    platform: string
}

export default function AITopIssues() {
    const [isLoading, setIsLoading] = useState(false)
    const [issues, setIssues] = useState<Issue[] | null>(null)
    const [marketingRec, setMarketingRec] = useState<MarketingRecommendation | null>(null)
    const [hasAnalyzed, setHasAnalyzed] = useState(false)

    const handleAnalyze = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/analytics/ai-issues', { method: 'POST' })
            if (res.ok) {
                const data = await res.json()
                setIssues(data.issues)
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
            {/* Marketing Recommendation Card */}
            {marketingRec && (
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl p-4 shadow-lg border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                        <Zap className="w-16 h-16" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <BrainCircuit className="w-4 h-4 text-violet-200" />
                            <h4 className="font-bold text-xs uppercase tracking-wider text-violet-100">{marketingRec.title}</h4>
                        </div>
                        <p className="font-bold text-lg mb-1">{marketingRec.platform}</p>
                        <p className="text-sm text-violet-100/90 leading-relaxed">
                            "{marketingRec.strategy}"
                        </p>
                    </div>
                </div>
            )}

            {issues?.map((issue, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-4 border-l-4 border-white/10 hover:bg-white/10 transition"
                    style={{
                        borderLeftColor: issue.severity === 'HIGH' ? '#ef4444' : issue.severity === 'MEDIUM' ? '#f59e0b' : '#22c55e'
                    }}
                >
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-white text-sm">{issue.title}</h4>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${issue.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                            issue.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                            {issue.severity === 'HIGH' ? 'ALTA' : issue.severity === 'MEDIUM' ? 'MEDIA' : 'BAJA'}
                        </span>
                    </div>

                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">{issue.summary}</p>

                    <div className="flex items-center gap-2 p-2 bg-black/20 rounded-lg">
                        <Zap className="w-3 h-3 text-yellow-400 shrink-0" />
                        <p className="text-gray-300 text-[10px] italic">"{issue.recommendation}"</p>
                    </div>
                </div>
            ))}
            <div className="text-center mt-2">
                <button onClick={handleAnalyze} className="text-xs text-violet-400 hover:text-white transition flex items-center justify-center gap-1 w-full opacity-50 hover:opacity-100">
                    <Loader2 className="w-3 h-3" /> Re-analizar
                </button>
            </div>
        </div>
    )
}


'use client'

import { useState } from 'react'
import { Sparkles, AlertTriangle, ThumbsUp, ThumbsDown, Utensils } from 'lucide-react'
import { motion } from 'framer-motion'

interface MenuAnalysis {
    starDish: { name: string; sentiment: number; mentions: number; reason: string } | null
    criticalDish: { name: string; sentiment: number; mentions: number; reason: string } | null
    lovedItems: { name: string; count: number }[]
    hatedItems: { name: string; count: number }[]
}

export default function MenuInsights() {
    const [analysis, setAnalysis] = useState<MenuAnalysis | null>(null)
    const [loading, setLoading] = useState(false)
    const [analyzed, setAnalyzed] = useState(false)

    const runAnalysis = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/analytics/menu-insights', { method: 'POST' })
            const data = await res.json()
            setAnalysis(data)
            setAnalyzed(true)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (!analyzed) {
        return (
            <div className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Utensils className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-600">
                        Inteligencia de Menú
                    </h3>
                    <p className="text-gray-400 max-w-md mt-2">
                        Nuestra IA leerá todos los comentarios para descubrir qué platillos aman tus clientes y cuáles necesitan mejorar.
                    </p>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={loading}
                    className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-100 transition flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <Sparkles className="w-5 h-5 animate-spin text-orange-500" />
                            Analizando sabores...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 text-orange-500" />
                            Analizar Menú
                        </>
                    )}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-orange-400" />
                    Análisis de Menú
                </h3>
                <button
                    onClick={runAnalysis}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                    <Sparkles className="w-3 h-3" /> Actualizar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Star Dish */}
                {analysis?.starDish ? (
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-500/10 to-orange-900/10 border border-orange-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                            <Sparkles className="w-24 h-24 text-orange-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-orange-400 font-medium mb-1">
                                <Sparkles className="w-4 h-4" /> Platillo Estrella
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-2">{analysis.starDish.name}</h4>
                            <p className="text-sm text-gray-400 italic mb-4">"{analysis.starDish.reason}"</p>
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold border border-orange-500/20">
                                    {analysis.starDish.sentiment}% Aprobación
                                </div>
                                <div className="text-xs text-gray-500">
                                    {analysis.starDish.mentions} menciones
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 text-sm">
                        No hay suficientes elogios aún.
                    </div>
                )}

                {/* Critical Dish */}
                {analysis?.criticalDish ? (
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                            <AlertTriangle className="w-24 h-24 text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-red-400 font-medium mb-1">
                                <AlertTriangle className="w-4 h-4" /> Requiere Atención
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-2">{analysis.criticalDish.name}</h4>
                            <p className="text-sm text-gray-400 italic mb-4">"{analysis.criticalDish.reason}"</p>
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/20">
                                    {analysis.criticalDish.sentiment}% Aprobación
                                </div>
                                <div className="text-xs text-gray-500">
                                    {analysis.criticalDish.mentions} menciones
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 text-sm">
                        ¡Todo parece estar delicioso! Sin críticas.
                    </div>
                )}
            </div>

            {/* Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-3xl bg-black/20 border border-white/5">
                    <h5 className="flex items-center gap-2 font-bold text-gray-300 mb-4">
                        <ThumbsUp className="w-4 h-4 text-green-400" /> Los Más Amados
                    </h5>
                    <ul className="space-y-3">
                        {analysis?.lovedItems.map((item, i) => (
                            <li key={i} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{item.name}</span>
                                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs">{item.count}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-6 rounded-3xl bg-black/20 border border-white/5">
                    <h5 className="flex items-center gap-2 font-bold text-gray-300 mb-4">
                        <ThumbsDown className="w-4 h-4 text-red-400" /> Oportunidades
                    </h5>
                    <ul className="space-y-3">
                        {analysis?.hatedItems.map((item, i) => (
                            <li key={i} className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{item.name}</span>
                                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-xs">{item.count}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

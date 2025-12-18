'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Flame, Shuffle, ArrowRight, Skull, Gamepad2 } from 'lucide-react'

// Content Pools
const DEFAULT_TRUTHS = [
    "¿Cuál es tu peor hábito al beber?",
    "¿Qué es lo más vergonzoso que has hecho en un bar?",
    "¿A quién de este grupo besarías?",
    "¿Cuál es tu fantasía secreta?",
    "¿Has sido infiel alguna vez?",
    "¿Qué es lo peor que le has dicho a una pareja?",
    "¿Muestra tu última foto de la galería.",
    "¿Cuánto es lo máximo que has gastado en una fiesta?"
]

const DEFAULT_DARES = [
    "Haz un baile sexy por 10 segundos.",
    "Déjate dar una nalgada por el jugador de la derecha.",
    "Bebe un shot sin manos.",
    "Intercambia una prenda con otro jugador.",
    "Habla con acento extranjero hasta tu próximo turno.",
    "Pide un trago con un nombre inventado al barman.",
    "Haz 10 sentadillas mientras bebes.",
    "Lame el cuello de la persona a tu izquierda."
]

const DEFAULT_EXTREME = [
    "🔥 EXTREMO: Beso de tres con dos jugadores a tu elección.",
    "🔥 EXTREMO: Body shot a la persona de enfrente.",
    "🔥 EXTREMO: Quítate dos prendas de ropa.",
    "🔥 EXTREMO: Envía un mensaje picante a tu ex.",
    "🔥 EXTREMO: Deja que el grupo prepare un shot 'especial' para ti."
]

interface TruthOrDareProps {
    customTruths?: string[]
    customDares?: string[]
    customExtremeDares?: string[]
    extremeInterval?: number
}

export default function TruthOrDare({ customTruths, customDares, customExtremeDares, extremeInterval = 8 }: TruthOrDareProps) {
    const [turnCount, setTurnCount] = useState(0)
    const [result, setResult] = useState<{ type: string, text: string, isExtreme?: boolean } | null>(null)
    const [history, setHistory] = useState<string[]>([])
    const [isFlipped, setIsFlipped] = useState(false)

    // Use custom content if available and not empty, otherwise default
    const activeTruths = (customTruths && customTruths.length > 0) ? customTruths : DEFAULT_TRUTHS
    const activeDares = (customDares && customDares.length > 0) ? customDares : DEFAULT_DARES
    const activeExtreme = (customExtremeDares && customExtremeDares.length > 0) ? customExtremeDares : DEFAULT_EXTREME

    // Helper to avoid immediate repetition (simple version)
    const getUniqueRandom = (pool: string[]) => {
        if (!pool || pool.length === 0) return "¡Sin contenido disponible!"

        // Filter out recent history (last 5)
        const available = pool.filter(item => !history.slice(-5).includes(item))
        const source = available.length > 0 ? available : pool

        const item = source[Math.floor(Math.random() * source.length)]
        setHistory(prev => [...prev.slice(-10), item]) // Keep last 10
        return item
    }

    const pickCard = (type: 'truth' | 'dare' | 'random') => {
        const nextTurn = turnCount + 1
        setTurnCount(nextTurn)

        // Extreme Rule: Every N turns
        // Ensure interval is valid (>0) and we have extreme dares available
        if (extremeInterval > 0 && nextTurn % extremeInterval === 0 && activeExtreme.length > 0) {
            const extremeContent = getUniqueRandom(activeExtreme)
            setResult({ type: 'extreme', text: extremeContent, isExtreme: true })
            setIsFlipped(true)
            return
        }

        let selectedType = type
        if (type === 'random') {
            selectedType = Math.random() > 0.5 ? 'truth' : 'dare'
        }

        const pool = selectedType === 'truth' ? activeTruths : activeDares
        // Fallback safety if empty
        if (!pool || pool.length === 0) {
            setResult({ type: selectedType, text: "No hay cartas disponibles." })
            setIsFlipped(true)
            return
        }

        const content = getUniqueRandom(pool)
        setResult({ type: selectedType, text: content })
        setIsFlipped(true)
    }

    const resetCard = () => {
        setIsFlipped(false)
        setResult(null)
    }

    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[450px] px-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />

            {/* Turn Counter */}
            <div className="mb-6 z-10">
                <span className="px-4 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-gray-300 uppercase tracking-widest backdrop-blur-md">
                    Turno #{turnCount}
                </span>
            </div>

            <AnimatePresence mode="wait">
                {!isFlipped ? (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ duration: 0.3 }}
                        className="w-full max-w-sm bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl relative z-20 flex flex-col items-center text-center"
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20 rotate-3 transform hover:rotate-6 transition-transform">
                            <Gamepad2 className="w-10 h-10 text-white" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">¿Tu Elección?</h2>
                        <p className="text-gray-400 text-sm mb-8 px-4">
                            El destino favorece a los valientes. Elige con sabiduría.
                        </p>

                        <div className="grid grid-cols-2 gap-4 w-full mb-4">
                            <button
                                onClick={() => pickCard('truth')}
                                className="group relative overflow-hidden p-6 rounded-2xl bg-blue-900/20 border border-blue-500/30 hover:border-blue-500/80 hover:bg-blue-600/20 transition-all flex flex-col items-center gap-3"
                            >
                                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Eye className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold text-blue-200">VERDAD</span>
                            </button>

                            <button
                                onClick={() => pickCard('dare')}
                                className="group relative overflow-hidden p-6 rounded-2xl bg-red-900/20 border border-red-500/30 hover:border-red-500/80 hover:bg-red-600/20 transition-all flex flex-col items-center gap-3"
                            >
                                <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Flame className="w-8 h-8 text-red-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold text-red-200">RETO</span>
                            </button>
                        </div>

                        <button
                            onClick={() => pickCard('random')}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10 hover:border-white/30 text-gray-300 font-bold text-sm tracking-wide hover:text-white transition-all flex items-center justify-center gap-2 group"
                        >
                            <Shuffle className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                            ELEGIR AL AZAR
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="w-full max-w-sm relative z-20"
                    >
                        <div className={`
                            relative overflow-hidden rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/15
                            ${result?.isExtreme
                                ? 'bg-gradient-to-br from-orange-900 to-red-950'
                                : result?.type === 'truth'
                                    ? 'bg-gradient-to-br from-blue-900 to-slate-950'
                                    : 'bg-gradient-to-br from-red-900 to-rose-950'}
                        `}>
                            {/* Background Pattern */}
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                {result?.type === 'truth' && <Eye className="w-32 h-32" />}
                                {result?.type === 'dare' && <Flame className="w-32 h-32" />}
                                {result?.type === 'extreme' && <Skull className="w-32 h-32" />}
                            </div>

                            <div className="relative z-10 flex flex-col items-center">
                                <span className={`
                                    inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-lg
                                    ${result?.isExtreme ? 'bg-orange-500 text-black animate-pulse' : 'bg-white/10 text-white'}
                                `}>
                                    {result?.isExtreme ? '🔥 EXTREMO 🔥' : result?.type === 'truth' ? 'VERDAD' : 'RETO'}
                                </span>

                                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-12 drop-shadow-md">
                                    "{result?.text}"
                                </h3>

                                <button
                                    onClick={resetCard}
                                    className="group flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                >
                                    Siguiente
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

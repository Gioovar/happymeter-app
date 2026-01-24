'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dices, Flame, RefreshCw, Skull, AlertTriangle, ArrowLeft } from 'lucide-react'
import { DiceItem, DEFAULT_STANDARD_ACTIONS, DEFAULT_STANDARD_BODY_PARTS, DEFAULT_EXTREME_ACTIONS, DEFAULT_EXTREME_BODY_PARTS } from '@/types/game-couple'

interface CoupleDiceProps {
    standardActions?: DiceItem[]
    extremeActions?: DiceItem[]
    standardBodyParts?: DiceItem[]
    extremeBodyParts?: DiceItem[]
    // Optional: Force a specific mode (useful for debugging/preview if needed, though we'll default to menu)
    initialIntensity?: 'standard' | 'extreme' | null
}

export default function CoupleDice({
    standardActions = DEFAULT_STANDARD_ACTIONS,
    extremeActions = DEFAULT_EXTREME_ACTIONS,
    standardBodyParts = DEFAULT_STANDARD_BODY_PARTS,
    extremeBodyParts = DEFAULT_EXTREME_BODY_PARTS,
    initialIntensity = null
}: CoupleDiceProps) {
    const [gameState, setGameState] = useState<'menu' | 'playing'>(initialIntensity ? 'playing' : 'menu')
    const [intensity, setIntensity] = useState<'standard' | 'extreme'>(initialIntensity || 'standard')

    const [isRolling, setIsRolling] = useState(false)
    const [result, setResult] = useState<{ action: DiceItem, bodyPart: DiceItem } | null>(null)

    const isExtreme = intensity === 'extreme'

    // Select active lists based on intensity
    const activeActions = isExtreme ? (extremeActions.length > 0 ? extremeActions : DEFAULT_EXTREME_ACTIONS) : (standardActions.length > 0 ? standardActions : DEFAULT_STANDARD_ACTIONS)
    const activeBodyParts = isExtreme ? (extremeBodyParts.length > 0 ? extremeBodyParts : DEFAULT_EXTREME_BODY_PARTS) : (standardBodyParts.length > 0 ? standardBodyParts : DEFAULT_STANDARD_BODY_PARTS)

    const startGame = (selectedMode: 'standard' | 'extreme') => {
        setIntensity(selectedMode)
        setGameState('playing')
        setResult(null)
    }

    const returnToMenu = () => {
        setGameState('menu')
        setResult(null)
    }

    const rollDice = () => {
        setIsRolling(true)
        setResult(null)

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50)
        }

        setTimeout(() => {
            const randomAction = activeActions[Math.floor(Math.random() * activeActions.length)]
            const randomBodyPart = activeBodyParts[Math.floor(Math.random() * activeBodyParts.length)]

            setResult({ action: randomAction, bodyPart: randomBodyPart })
            setIsRolling(false)

            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                // Heavier vibration for extreme mode
                isExtreme ? navigator.vibrate([100, 50, 100]) : navigator.vibrate([50, 50, 50])
            }

        }, 1500)
    }

    // --- MENU OVERLAY ---
    if (gameState === 'menu') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-md mx-auto relative overflow-hidden font-serif border-4 border-white/10 rounded-3xl bg-black">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-red-900 opacity-60" />

                <div className="relative z-10 flex flex-col items-center w-full p-8 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-400 mb-2">
                            DADOS DEL DESEO
                        </h1>
                        <p className="text-gray-400 text-sm">Elige tu nivel de intensidad</p>
                    </motion.div>

                    <div className="w-full space-y-4">
                        <button
                            onClick={() => startGame('standard')}
                            className="w-full relative group overflow-hidden rounded-2xl p-6 border border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/40 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-full text-purple-300 group-hover:scale-110 transition-transform">
                                    <Flame className="w-8 h-8" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-bold text-purple-300">Romántico</h3>
                                    <p className="text-xs text-purple-200/60">Besos, caricias y juegos suaves.</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={() => startGame('extreme')}
                            className="w-full relative group overflow-hidden rounded-2xl p-6 border border-red-500/30 bg-red-900/20 hover:bg-red-900/40 transition-all duration-300"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/20 rounded-full text-red-500 group-hover:scale-110 transition-transform">
                                    <Skull className="w-8 h-8" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-bold text-red-500">Extremo</h3>
                                    <p className="text-xs text-red-200/60">Retos fuertes. Solo para valientes.</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`flex flex-col items-center justify-center min-h-[500px] w-full max-w-md mx-auto relative overflow-hidden font-serif border-4 ${isExtreme ? 'border-red-900/50' : 'border-purple-900/30'} rounded-3xl transition-colors duration-500`}>

            {/* Background Atmosphere */}
            <div className={`absolute inset-0 bg-gradient-to-b ${isExtreme ? 'from-black via-red-950 to-black' : 'from-purple-900 via-red-900 to-black'} rounded-3xl opacity-90 transition-colors duration-500`} />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

            {/* Back Button */}
            <button
                onClick={returnToMenu}
                className="absolute top-4 left-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Extreme Mode Overlay Effects */}
            {isExtreme && (
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
                    <motion.div
                        animate={{ opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-red-600/10 mix-blend-overlay"
                    />
                </div>
            )}

            <div className="relative z-10 w-full p-6 flex flex-col items-center">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className={`inline-flex items-center justify-center p-3 rounded-full mb-3 border shadow-lg ${isExtreme ? 'bg-red-600/20 border-red-500/50 shadow-red-900/80' : 'bg-red-500/10 border-red-500/20 shadow-red-900/50'}`}>
                        {isExtreme ? <Skull className="w-8 h-8 text-red-500 fill-red-900 animate-pulse" /> : <Flame className="w-8 h-8 text-red-500 fill-red-500 animate-pulse" />}
                    </div>
                    <h2 className={`text-3xl font-bold text-transparent bg-clip-text tracking-wider ${isExtreme ? 'bg-gradient-to-r from-red-500 to-red-800' : 'bg-gradient-to-r from-red-400 to-purple-400'}`}>
                        {isExtreme ? 'MODO EXTREMO' : 'DADOS DEL DESEO'}
                    </h2>
                    <p className="text-red-200/60 text-sm italic mt-2">
                        {isExtreme ? 'Solo para valientes...' : 'Deja que el azar decida tu próxima caricia.'}
                    </p>
                </motion.div>

                {/* Dice Display */}
                <div className="flex gap-6 mb-12">
                    {/* Action Die */}
                    <Cube
                        rolling={isRolling}
                        content={result ? result.action.icon : "?"}
                        label={result ? result.action.text : "Acción"}
                        color={isExtreme ? "from-red-900 to-black border-red-600" : "from-red-600 to-red-800 border-white/20"}
                        delay={0}
                        textColor={result?.action.color}
                    />

                    {/* Body Part Die */}
                    <Cube
                        rolling={isRolling}
                        content={result ? result.bodyPart.icon : "?"}
                        label={result ? result.bodyPart.text : "Lugar"}
                        color={isExtreme ? "from-red-900 to-black border-red-600" : "from-purple-600 to-purple-800 border-white/20"}
                        delay={0.2}
                    />
                </div>

                {/* Result Text */}
                <div className="h-20 mb-6 text-center flex items-center justify-center w-full">
                    <AnimatePresence mode='wait'>
                        {result && !isRolling && (
                            <motion.div
                                key={result.action.text + result.bodyPart.text}
                                initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
                                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                                exit={{ opacity: 0, scale: 0.8, rotateX: 90 }}
                                className={`px-6 py-4 rounded-2xl border backdrop-blur-md w-full max-w-xs ${isExtreme ? 'bg-black/80 border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'bg-black/40 border-white/10'}`}
                            >
                                <p className="text-xl text-white leading-tight">
                                    <span className={`block text-2xl mb-1 ${result.action.color || 'text-white'} font-bold`}>{result.action.text}</span>
                                    <span className="text-sm text-gray-500 uppercase tracking-widest text-[10px]">en</span>
                                    <span className={`block text-2xl mt-1 ${isExtreme ? 'text-red-500' : 'text-purple-300'} font-bold`}>{result.bodyPart.text}</span>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Roll Button */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={rollDice}
                    disabled={isRolling}
                    className={`w-full max-w-xs py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group border transition-all duration-300
                        ${isExtreme
                            ? 'bg-gradient-to-r from-red-900 to-black border-red-600 shadow-[0_0_15px_rgba(185,28,28,0.5)] hover:shadow-[0_0_25px_rgba(220,38,38,0.7)]'
                            : 'bg-gradient-to-r from-red-600 to-purple-600 border-white/10 shadow-xl shadow-red-900/40'
                        }`}
                >
                    {isRolling ? (
                        <>
                            <RefreshCw className="w-5 h-5 animate-spin" /> {isExtreme ? 'Invocando...' : 'Lanzando...'}
                        </>
                    ) : (
                        <>
                            {isExtreme ? <Skull className="w-6 h-6" /> : <Dices className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
                            {result ? "Tirar de Nuevo" : "Lanzar Dados"}
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    )
}

// --- Subcomponent: 3D Cube Representation ---
function Cube({ rolling, content, label, color, delay, textColor }: { rolling: boolean, content: string, label: string, color: string, delay: number, textColor?: string }) {
    return (
        <div className="flex flex-col items-center gap-3 relative">
            <motion.div
                className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${color} shadow-2xl flex items-center justify-center relative z-10 border-2`}
                animate={rolling ? {
                    rotateX: [0, 360, 720, 1080],
                    rotateY: [0, 360, 720, 1080],
                    y: [0, -20, 0, -10, 0],
                    scale: [1, 1.1, 1]
                } : {
                    rotateX: 0,
                    rotateY: 0,
                    y: 0,
                    scale: 1
                }}
                transition={rolling ? { duration: 1.5, ease: "easeInOut", delay } : { type: "spring" }}
            >
                <span className={`text-4xl drop-shadow-md select-none ${textColor || 'text-white'}`}>{content}</span>

                {/* Shine Filter */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-2xl pointer-events-none" />
            </motion.div>

            <span className="text-xs font-bold uppercase tracking-widest text-white/50">{label}</span>

            {/* Shadow */}
            <div className="absolute bottom-5 w-20 h-4 bg-black/50 blur-lg rounded-full z-0" />
        </div>
    )
}

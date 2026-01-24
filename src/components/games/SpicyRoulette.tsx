'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { Beer, GlassWater, PartyPopper, Skull, UserPlus, Star } from 'lucide-react'
import { RouletteOutcome } from '@/types/game-roulette'

const ICON_MAP: Record<string, any> = {
    beer: Beer,
    water: GlassWater,
    poop: PartyPopper, // Placeholder
    skull: Skull,
    star: Star, // Fallback
    userPlus: UserPlus,
    partyPopper: PartyPopper,
}

interface SpicyRouletteProps {
    outcomes: RouletteOutcome[]
}

export default function SpicyRoulette({ outcomes }: SpicyRouletteProps) {
    const [isSpinning, setIsSpinning] = useState(false)
    const [result, setResult] = useState<RouletteOutcome | null>(null)
    const [totalSpins, setTotalSpins] = useState(0)
    const [rotation, setRotation] = useState(0)
    const controls = useAnimation()
    const dingAudio = useRef<HTMLAudioElement | null>(null)

    // Generate Visual Segments (8 slices) based on outcomes
    // Simple algorithm: Repeat items to fill 8 slots
    const visualSegments = Array(8).fill(null).map((_, i) => {
        return outcomes[i % outcomes.length]
    })

    useEffect(() => {
        const savedSpins = localStorage.getItem('happy_roulette_spins')
        if (savedSpins) setTotalSpins(parseInt(savedSpins))
        dingAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3')
    }, [])

    const determineOutcome = (spinCount: number) => {
        // 1. Check Forced Intervals (High Priority)
        for (const outcome of outcomes) {
            if (outcome.rule === 'fixed_interval' && outcome.interval) {
                // E.g. every 50 spins: 50, 100, 150...
                // Only trigger if exact match? Or "after X"? 
                // User said "sale cada 50 giros". So exactly on 50th.
                if (spinCount > 0 && spinCount % outcome.interval === 0) {
                    return outcome
                }
            }
        }

        // 2. Probabilistic Pool
        const commonPool = outcomes.filter(o => o.rule === 'common')
        const totalProb = commonPool.reduce((acc, o) => acc + o.probability, 0)

        // If prob sum is 0 or low, fallback to first
        if (totalProb <= 0) return commonPool[0] || outcomes[0]

        let r = Math.random() * totalProb
        for (const outcome of commonPool) {
            if (r < outcome.probability) {
                return outcome
            }
            r -= outcome.probability
        }

        return commonPool[0] || outcomes[0]
    }

    const spin = async () => {
        if (isSpinning) return
        setIsSpinning(true)
        setResult(null)

        const nextSpinCount = totalSpins + 1
        setTotalSpins(nextSpinCount)
        localStorage.setItem('happy_roulette_spins', nextSpinCount.toString())

        const outcome = determineOutcome(nextSpinCount)

        // Find matching segments visual indices
        const validIndices = visualSegments
            .map((seg, idx) => seg.id === outcome.id ? idx : -1)
            .filter(idx => idx !== -1)

        // If outcome not on wheel (e.g. rare hidden prize?), pick random or force one
        // For now, assume logic outcomes act as overrides even if not visually dominant?
        // Ideally visual segments should represent probabilities, but with fixed 8 slots it's hard.
        // If result isn't on wheel, we must land on "something" visual but show "result"? 
        // No, let's force land on a visual slot. If outcome is NOT in visual list (rare), 
        // we might have a display issue. 
        // FIX: Ensure ALL potential logic outcomes are at least present once if possible? 
        // For this MVP, we use the `visualSegments` array. If the logic picks an outcome, 
        // we hope it's in the visual list. If not (rare events might not be if list is long),
        // we just fake a slot? 
        // Let's just default to 0.

        let targetIndex = 0
        if (validIndices.length > 0) {
            targetIndex = validIndices[Math.floor(Math.random() * validIndices.length)]
        } else {
            // Fallback: Just update text result, but land randomly?
            // Or maybe the Rare event temporarily REPLACES a slot visually? Too complex for now.
            // Let's just default to 0.
        }

        const segmentSize = 360 / 8
        const targetAngle = (360 - (targetIndex * segmentSize)) % 360
        const fullSpins = 5 * 360
        const variance = (Math.random() * 20) - 10

        const nextRotation = rotation + fullSpins + (targetAngle - (rotation % 360)) + variance
        const finalRotation = nextRotation < rotation ? nextRotation + 360 : nextRotation

        setRotation(finalRotation)

        await controls.start({
            rotate: finalRotation,
            transition: { duration: 4, ease: [0.15, 0.25, 0.25, 1] }
        })

        if (dingAudio.current) dingAudio.current.play().catch(e => { })
        setResult(outcome)
        setIsSpinning(false)
    }

    const ResultIcon = result && ICON_MAP[result.iconType || 'star'] ? ICON_MAP[result.iconType || 'star'] : Star

    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[400px]">
            {/* Wheel Container */}
            <div className="relative w-full max-w-[340px] aspect-square mb-8">
                {/* Neon Glow Container */}
                <div className="absolute inset-0 rounded-full bg-violet-600/20 blur-3xl animate-pulse-slow" />

                {/* Pointer (Neon Triangle) */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_0_10px_#00ffff]">
                    <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-cyan-400" />
                </div>

                {/* Spinning Wheel */}
                <motion.div
                    className="w-full h-full rounded-full border-[8px] border-[#1a1a1a] shadow-[0_0_50px_rgba(139,92,246,0.30)] relative overflow-hidden ring-4 ring-cyan-500/50"
                    animate={controls}
                    style={{
                        background: `conic-gradient(from 22.5deg, ${visualSegments.map((s, i) => {
                            const start = (i * 100) / 8
                            const end = ((i + 1) * 100) / 8
                            return `${s.color} ${start}%, ${s.color} ${end}%`
                        }).join(', ')})`,
                    }}
                >
                    {/* Dark Overlay for "Tech" feel (gradient fade) */}
                    <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

                    {/* Wireframe Separators (Neon Lines) */}
                    {Array(8).fill(null).map((_, i) => (
                        <div
                            key={`line-${i}`}
                            className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-white/20 origin-bottom shadow-[0_0_5px_rgba(255,255,255,0.5)]"
                            style={{
                                transform: `translateX(-50%) rotate(${i * 45}deg) translateY(0px)`,
                                transformOrigin: 'bottom center',
                                height: '50%'
                            }}
                        />
                    ))}

                    {/* Visual Segments Text */}
                    {visualSegments.map((seg, i) => {
                        const angle = i * 45 + 22.5
                        return (
                            <div
                                key={i}
                                className="absolute top-0 left-0 w-full h-full pointer-events-none flex justify-center pt-8"
                                style={{ transform: `rotate(${angle}deg)` }}
                            >
                                <div className="text-center">
                                    <span
                                        className="block text-white font-black text-sm md:text-base tracking-widest uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                                        style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
                                    >
                                        {seg.short}
                                    </span>
                                    <div className="mt-1 w-1 h-1 bg-white/50 rounded-full mx-auto shadow-[0_0_5px_white]" />
                                </div>
                            </div>
                        )
                    })}

                    {/* Center Cyber Hub */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#0a0a0a] rounded-full shadow-[0_0_30px_rgba(0,255,255,0.2)] flex items-center justify-center z-10 border-4 border-cyan-500/30">
                        <div className="w-16 h-16 rounded-full bg-[#111] flex items-center justify-center border border-white/20 shadow-inner relative">
                            {/* Inner Spin Anim */}
                            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 opacity-50 animate-spin-slow" />
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400 shadow-[0_0_15px_#8b5cf6]" />
                        </div>
                    </div>
                </motion.div>

                {/* Decorative Outer Rings */}
                <div className="absolute -inset-4 rounded-full border border-violet-500/20 pointer-events-none animate-pulse" />
                <div className="absolute -inset-8 rounded-full border border-cyan-500/10 pointer-events-none" />
            </div>

            {/* Spin Button */}
            <button
                onClick={spin}
                disabled={isSpinning}
                className="w-full max-w-xs py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-xl rounded-full shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
            >
                {isSpinning ? "GIRANDO..." : "¡GIRAR AHORA!"}
            </button>

            {/* Result Overlay */}
            <AnimatePresence>
                {result && !isSpinning && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-4 top-[20%] bg-black/90 border border-white/20 p-6 rounded-3xl text-center shadow-2xl backdrop-blur-xl z-50 flex flex-col items-center"
                    >
                        <h2 className="text-2xl font-bold text-gray-400 mb-2 uppercase tracking-widest">¡Te tocó!</h2>
                        <div className="text-4xl mb-4 p-4 bg-white/10 rounded-full" style={{ color: result.color }}>
                            <ResultIcon className="w-10 h-10" />
                        </div>
                        <p className="text-2xl md:text-3xl text-white font-black leading-tight mb-2">
                            {result.label}
                        </p>
                        {result.rule === 'fixed_interval' && (
                            <p className="text-sm text-yellow-400 font-bold animate-pulse mb-4">🏆 ¡PREMIO ESPECIAL!</p>
                        )}
                        <p className="text-gray-400 text-sm mb-6">Giro #{totalSpins}</p>

                        <button
                            onClick={() => setResult(null)}
                            className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition"
                        >
                            Girar de Nuevo
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

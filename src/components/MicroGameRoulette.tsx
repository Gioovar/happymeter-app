'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { Beer, GlassWater, PartyPopper, Skull, UserPlus, Star, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'
import { RouletteOutcome } from '@/types/game-roulette'

const ICON_MAP: Record<string, any> = {
    beer: Beer,
    water: GlassWater,
    poop: PartyPopper,
    skull: Skull,
    star: Star,
    userPlus: UserPlus,
    partyPopper: PartyPopper,
    zap: Zap
}

interface MicroGameRouletteProps {
    onPrizeWon: (prize: string) => void
    outcomes?: RouletteOutcome[]
    gameOwnerId?: string
}

const DEFAULT_PRIZES: RouletteOutcome[] = [
    { id: '1', label: '10% Desc.', color: '#8b5cf6', probability: 1, rule: 'common' },
    { id: '2', label: 'Refresco Gratis', color: '#ec4899', probability: 1, rule: 'common' },
    { id: '3', label: 'Suerte la próxima', color: '#6b7280', probability: 1, rule: 'common' },
    { id: '4', label: '2x1 Cerveza', color: '#eab308', probability: 1, rule: 'common' },
    { id: '5', label: 'Postre Gratis', color: '#22c55e', probability: 1, rule: 'common' },
    { id: '6', label: '5% Desc.', color: '#3b82f6', probability: 1, rule: 'common' },
    { id: '7', label: 'Shot Gratis', color: '#ef4444', probability: 1, rule: 'common' },
    { id: '8', label: 'Abrazo', color: '#f97316', probability: 1, rule: 'common' },
]

export default function MicroGameRoulette({ onPrizeWon, outcomes, gameOwnerId }: MicroGameRouletteProps) {
    // Ensure we always have at least 8 segments for the visual style
    const pricesSource = outcomes && outcomes.length > 0 ? outcomes : DEFAULT_PRIZES

    // Generate Visual Segments (8 slices) based on outcomes for the Conic Gradient style
    // We repeat items if fewer than 8 to fill the circle nicely
    const visualSegments = Array(8).fill(null).map((_, i) => {
        return pricesSource[i % pricesSource.length]
    })

    const [isSpinning, setIsSpinning] = useState(false)
    const [result, setResult] = useState<RouletteOutcome | null>(null)
    const [rotation, setRotation] = useState(0)
    const controls = useAnimation()
    const dingAudio = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        dingAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3')
    }, [])

    const handleSpin = async () => {
        if (isSpinning) return

        console.log('[MicroGameRoulette] Action: Spin', { gameOwnerId })
        setIsSpinning(true)
        setResult(null)

        // 1. Determine Winner via API or Fallback
        let outcome: RouletteOutcome | null = null

        // Start a "visual" accumulation of rotation immediately so user feels response
        // We'll add a minimal spin duration to ensure visuals look good
        const minSpinPromise = new Promise(resolve => setTimeout(resolve, 1500)) // 1.5s min spin

        try {
            let winnerIndex = 0

            if (gameOwnerId) {
                try {
                    const res = await fetch('/api/games/spin', {
                        method: 'POST',
                        body: JSON.stringify({ userId: gameOwnerId })
                    })

                    if (res.ok) {
                        const data = await res.json()
                        console.log('[MicroGameRoulette] API Success:', data)
                        if (data.winnerIndex !== undefined && pricesSource[data.winnerIndex]) {
                            outcome = pricesSource[data.winnerIndex]
                        }
                    } else {
                        console.warn('[MicroGameRoulette] API returned error, using fallback')
                    }
                } catch (e) {
                    console.error('[MicroGameRoulette] API Network Error', e)
                }
            }

            // Fallback if API failed or no ID
            if (!outcome) {
                const fallbackIdx = Math.floor(Math.random() * pricesToUse.length)
                outcome = pricesSource[fallbackIdx]
            }

            // 2. Calculate Visual Target
            // We need to verify where this outcome lives in our `visualSegments` (8 slots)
            // It might appear multiple times or once. We pick a random valid slot.
            const validIndices = visualSegments
                .map((seg, idx) => seg.id === outcome!.id ? idx : -1)
                .filter(idx => idx !== -1)

            let targetIndex = 0
            if (validIndices.length > 0) {
                targetIndex = validIndices[Math.floor(Math.random() * validIndices.length)]
            } else {
                // If the winner isn't in the visual 8 (rare?), pick random
                targetIndex = Math.floor(Math.random() * 8)
            }

            const segmentSize = 360 / 8
            // Calculate angle to land (0 is top in standard math, but check CSS rotation)
            // In the visual component, index 0 is at 22.5deg?
            // Let's rely on the dashboard logic: 
            // const targetAngle = (360 - (targetIndex * segmentSize)) % 360
            const targetAngle = (360 - (targetIndex * segmentSize)) % 360

            const fullSpins = 5 * 360 // 5 full turns
            const variance = (Math.random() * 20) - 10 // randomness inside wedge

            const nextRotation = rotation + fullSpins + (targetAngle - (rotation % 360)) + variance
            const finalRotation = nextRotation < rotation ? nextRotation + 360 : nextRotation

            setRotation(finalRotation)

            // Ensure min spin time has passed
            await minSpinPromise

            // Animate to target
            await controls.start({
                rotate: finalRotation,
                transition: { duration: 4, ease: [0.15, 0.25, 0.25, 1] }
            })

            // 3. Show Result
            if (dingAudio.current) dingAudio.current.play().catch(() => { })
            setResult(outcome)
            setIsSpinning(false)
            onPrizeWon(outcome.label)

            if (outcome.label !== 'Suerte la próxima') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: [outcome.color, '#ffffff']
                })
            }

        } catch (error) {
            console.error('[MicroGameRoulette] Critical Error', error)
            setIsSpinning(false)
        }
    }

    // Helper ref for prices
    const pricesToUse = pricesSource

    const ResultIcon = result && ICON_MAP[result.iconType || 'star']
        ? ICON_MAP[result.iconType || 'star']
        : (result?.rule === 'fixed_interval' ? Zap : Star)

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
                    initial={{ rotate: rotation }}
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
                                        className="block text-white font-black text-xs sm:text-sm tracking-widest uppercase drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] max-w-[80px] leading-tight"
                                        style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}
                                    >
                                        {seg.label}
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
                            <div className={`absolute inset-0 rounded-full border-t-2 border-cyan-400 opacity-50 ${isSpinning ? 'animate-spin' : ''}`} />
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
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full max-w-xs py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-xl rounded-full shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 z-10"
            >
                {isSpinning ? "GIRANDO..." : "¡GIRAR AHORA!"}
            </button>

            {/* Result Overlay (Reinstated as per Dashboard consistency request) */}
            <AnimatePresence>
                {result && !isSpinning && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="w-full max-w-sm bg-black/90 border border-white/20 p-6 rounded-3xl text-center shadow-2xl backdrop-blur-xl flex flex-col items-center relative overflow-hidden"
                        >
                            {/* Bg FX */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />

                            <h2 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-widest z-10">¡Te tocó!</h2>
                            <div className="text-4xl mb-4 p-6 bg-white/5 rounded-full border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)] z-10" style={{ color: result.color }}>
                                <ResultIcon className="w-12 h-12" />
                            </div>
                            <p className="text-3xl text-white font-black leading-tight mb-2 z-10">
                                {result.label}
                            </p>
                            {result.rule === 'fixed_interval' && (
                                <p className="text-sm text-yellow-400 font-bold animate-pulse mb-6 z-10">🏆 ¡PREMIO ESPECIAL!</p>
                            )}

                            <button
                                onClick={() => setResult(null)}
                                className="mt-6 px-8 py-3 bg-white text-black font-bold text-lg rounded-full hover:bg-gray-200 transition shadow-lg shadow-white/20 z-10"
                            >
                                Girar de Nuevo
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

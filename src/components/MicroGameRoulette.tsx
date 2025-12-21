'use client'

import { useState, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Gift, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'

import { RouletteOutcome } from '@/types/game-roulette'

interface MicroGameRouletteProps {
    onPrizeWon: (prize: string) => void
    outcomes?: RouletteOutcome[]
}

const DEFAULT_PRIZES = [
    { label: '10% Desc.', color: '#8b5cf6' }, // Violet
    { label: 'Refresco Gratis', color: '#ec4899' }, // Pink
    { label: 'Suerte la próxima', color: '#6b7280' }, // Gray
    { label: '2x1 Cerveza', color: '#eab308' }, // Yellow
    { label: 'Postre Gratis', color: '#22c55e' }, // Green
    { label: '5% Desc.', color: '#3b82f6' }, // Blue
]

export default function MicroGameRoulette({ onPrizeWon, outcomes }: MicroGameRouletteProps) {
    const prizesToUse = outcomes && outcomes.length > 0 ? outcomes : DEFAULT_PRIZES
    const [spinning, setSpinning] = useState(false)
    const [hasSpun, setHasSpun] = useState(false)
    const [finalPrize, setFinalPrize] = useState<string | null>(null)
    const textControls = useAnimation()
    const wheelRef = useRef<HTMLDivElement>(null)

    // Rotation state
    const [rotation, setRotation] = useState(0)

    const handleSpin = async () => {
        if (spinning || hasSpun) return

        setSpinning(true)

        // Random spin calculation
        // Ensure it spins at least 5 times (1800 deg) + random segment
        const segmentAngle = 360 / prizesToUse.length
        // Pick a random winning index (usually you'd control this via backend probabilities)
        // For demo, let's avoid "Suerte la próxima" (index 2) slightly to be nice, but keep it random
        let winningIndex = Math.floor(Math.random() * prizesToUse.length)

        // Calculate total rotation needed to land on winningIndex
        // The pointer is usually at top (0 deg). 
        // If we rotate clockwise, the segment at TOP will be: 360 - (finalRotation % 360)
        // To land on index i, we need rotation such that: (rotation % 360) brings index i to top.
        // Actually simplest is just random massive rotation.

        const extraSpins = 5 + Math.random() * 5 // 5 to 10 full spins
        const totalDegrees = Math.floor(extraSpins * 360) + Math.floor(Math.random() * 360)

        setRotation(totalDegrees)

        // Wait for animation (css transition usually ~5s)
        await new Promise(resolve => setTimeout(resolve, 5000))

        // Calculate functionality
        const finalAngle = totalDegrees % 360
        // Pointer is at top. Wheel rotated clockwise.
        // The segment at 0 degrees is now at 'finalAngle'.
        // We need to map finalAngle to the PRIZE list.
        // Correct math: index = floor( (360 - finalAngle) / segmentAngle ) % count
        const winningIdx = Math.floor(((360 - finalAngle) % 360) / segmentAngle)
        const prize = prizesToUse[winningIdx]

        setFinalPrize(prize.label)
        onPrizeWon(prize.label)
        setHasSpun(true)
        setSpinning(false)

        if (prize.label !== 'Suerte la próxima') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: [prize.color, '#ffffff']
            })
        }
    }

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-[320px] mx-auto">
            {!hasSpun ? (
                // Hide default header since we moved it to page.tsx for global control
                null
            ) : (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="w-full max-w-sm bg-[#0a0a0a] rounded-3xl border border-white/10 p-8 text-center shadow-2xl relative overflow-hidden"
                    >
                        {/* Glow FX */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-violet-500/20 blur-[50px] rounded-full pointer-events-none" />

                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">¡TE TOCÓ!</p>

                        <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-inner">
                            <Zap className="w-10 h-10 text-yellow-400 fill-yellow-400 drop-shadow-md" />
                        </div>

                        <h3 className="text-4xl font-black text-white mb-2 drop-shadow-lg">{finalPrize}</h3>
                        <p className="text-sm text-gray-500 mb-8">Giro #{Math.floor(Math.random() * 900) + 100}</p>

                        <button
                            onClick={() => {
                                setHasSpun(false)
                                setRotation(0)
                            }}
                            className="w-full py-4 bg-white text-black font-black text-lg rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                        >
                            Girar de Nuevo
                        </button>
                    </motion.div>
                </div>
            )}

            <div className="relative w-80 h-80 md:w-96 md:h-96 mb-10 group">
                {/* Outer Glow Ring (Static) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl pointer-events-none" />

                {/* Decorative Outer Ring (Spinning slowly in opposite direction for effect could be cool, but static is safer for performance) */}
                <div className="absolute -inset-4 rounded-full border border-white/5 border-t-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]" />

                {/* Pointer - Cyan Triangle with neon glow */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                    <div className="w-0 h-0 border-l-[18px] border-l-transparent border-t-[32px] border-t-cyan-400 border-r-[18px] border-r-transparent animate-pulse"></div>
                </div>

                {/* Wheel Container */}
                <div
                    className="w-full h-full rounded-full border-[10px] border-[#0F0F13] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden bg-[#1a1a1a]"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)'
                    }}
                >
                    {/* Render Segments */}
                    {prizesToUse.map((prize, index) => {
                        const angle = 360 / prizesToUse.length
                        const rotate = angle * index
                        return (
                            <div
                                key={index}
                                className="absolute top-0 left-1/2 w-full h-[50%] origin-bottom"
                                style={{
                                    transform: `translateX(-50%) rotate(${rotate}deg)`,
                                    clipPath: 'polygon(50% 100%, 0 0, 100% 0)'
                                }}
                            >
                                {/* Segment Color with 3D Gradient Overlay */}
                                <div
                                    className="w-full h-full absolute top-0 left-0"
                                    style={{
                                        backgroundColor: prize.color,
                                        // Radial gradient for 3D depth + Linear for sheen
                                        backgroundImage: `
                                            radial-gradient(circle at 50% 100%, rgba(0,0,0,0.6) 0%, transparent 60%),
                                            linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.1) 100%)
                                        `,
                                        transform: `rotate(${90 - (angle / 2)}deg)`
                                    }}
                                />
                                {/* Label with Glow */}
                                <div
                                    className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-black text-sm md:text-base uppercase whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                                    style={{
                                        transform: 'rotate(90deg)',
                                        textShadow: '0 0 10px rgba(0,0,0,0.5)'
                                    }}
                                >
                                    {prize.label}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Center Hub (Tech Style) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#0F0F13] rounded-full shadow-[0_0_20px_rgba(0,0,0,1)] z-20 flex items-center justify-center border border-white/5">
                    {/* Inner Metallic Ring */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600 flex items-center justify-center shadow-inner">
                        {/* Core Light */}
                        <div className={`w-6 h-6 rounded-full transition-all duration-300 ${spinning ? 'bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)] scale-110' : 'bg-gray-800 shadow-none'}`} />
                    </div>
                </div>
            </div>

            <button
                onClick={handleSpin}
                disabled={spinning || hasSpun}
                className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-fuchsia-900/40 relative overflow-hidden group ${spinning || hasSpun
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed hidden'
                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    }`}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <span className="relative z-10 drop-shadow-md">{spinning ? 'Girando...' : '¡GIRAR AHORA!'}</span>
            </button>
        </div>
    )
}

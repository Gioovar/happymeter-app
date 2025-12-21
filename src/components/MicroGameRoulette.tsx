'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Gift, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'

import { RouletteOutcome } from '@/types/game-roulette'

interface MicroGameRouletteProps {
    onPrizeWon: (prize: string) => void
    outcomes?: RouletteOutcome[]
    gameOwnerId?: string
}

const DEFAULT_PRIZES = [
    { label: '10% Desc.', color: '#8b5cf6' }, // Violet
    { label: 'Refresco Gratis', color: '#ec4899' }, // Pink
    { label: 'Suerte la próxima', color: '#6b7280' }, // Gray
    { label: '2x1 Cerveza', color: '#eab308' }, // Yellow
    { label: 'Postre Gratis', color: '#22c55e' }, // Green
    { label: '5% Desc.', color: '#3b82f6' }, // Blue
]

export default function MicroGameRoulette({ onPrizeWon, outcomes, gameOwnerId }: MicroGameRouletteProps) {
    const prizesToUse = outcomes && outcomes.length > 0 ? outcomes : DEFAULT_PRIZES
    const [spinning, setSpinning] = useState(false)
    const [hasSpun, setHasSpun] = useState(false)
    const [finalPrize, setFinalPrize] = useState<string | null>(null)
    const [rotation, setRotation] = useState(0)

    // "Optimistic" spin state
    // When true, we add a CSS class that spins the wheel infinitely
    const [isInfiniteSpinning, setIsInfiniteSpinning] = useState(false)

    const handleSpin = async () => {
        if (spinning || hasSpun) return

        console.log('[MicroGameRoulette] Starting spin...', { gameOwnerId })
        setSpinning(true)
        setHasSpun(false)
        setFinalPrize(null)

        // Start infinite spin immediately for instant feedback
        setIsInfiniteSpinning(true)

        try {
            // 1. Get Winner from API
            let winningIdx = 0

            // Artificial delay to ensure the user sees the spin start if API is too fast
            const minSpinTime = new Promise(resolve => setTimeout(resolve, 800))

            let apiSuccess = false;

            if (gameOwnerId) {
                try {
                    const res = await fetch('/api/games/spin', {
                        method: 'POST',
                        body: JSON.stringify({ userId: gameOwnerId })
                    })

                    if (!res.ok) {
                        const errText = await res.text()
                        console.error('[MicroGameRoulette] API Error:', res.status, errText)
                        // Fallback
                        winningIdx = Math.floor(Math.random() * prizesToUse.length)
                    } else {
                        const data = await res.json()
                        console.log('[MicroGameRoulette] API Success:', data)
                        if (data.winnerIndex !== undefined) {
                            winningIdx = data.winnerIndex
                            apiSuccess = true
                        } else {
                            winningIdx = Math.floor(Math.random() * prizesToUse.length)
                        }
                    }
                } catch (apiErr) {
                    console.error('[MicroGameRoulette] API Fetch Failed:', apiErr)
                    winningIdx = Math.floor(Math.random() * prizesToUse.length)
                }
            } else {
                winningIdx = Math.floor(Math.random() * prizesToUse.length)
            }

            await minSpinTime

            // 2. Transition from Infinite to Targeted Spin
            // We stop the infinite spin and instantly set the current rotation to a value 
            // that looks consistent, then animate to the target.
            // Since we can't easily sync React state with CSS animation phase, 
            // we will reset rotation to 0 (or keep current) and animate to target.
            // A simple trick: Stop infinite, start big rotation from current angle? 
            // Actually, `rotation` state hasn't changed during CSS spin.
            // To make it smooth: we just let the "stopping" animation take over.

            setIsInfiniteSpinning(false)

            console.log('[MicroGameRoulette] Winner Index:', winningIdx)

            // Calculate precise target
            const segmentAngle = 360 / prizesToUse.length
            const segmentCenter = (winningIdx * segmentAngle) + (segmentAngle / 2)

            // Add noise
            const noise = (Math.random() - 0.5) * (segmentAngle * 0.8)

            // Target angle (0-360) where we want to land
            // Note: The pointer is at TOP (270deg or -90deg visually). 
            // Our reference 0 is usually 3 o'clock. 
            // Let's rely on the previous math which seemed to work:
            // targetMod = (360 - segmentCenter + noise) % 360

            const targetMod = (360 - segmentCenter + noise) % 360
            const currentMod = rotation % 360
            let dist = targetMod - currentMod
            if (dist < 0) dist += 360

            // Add extra spins for the "stopping" phase
            const extraSpins = 3 + Math.floor(Math.random() * 2)
            const finalRotation = rotation + dist + (360 * extraSpins)

            // Force a small jump to current rotation effectively? 
            // Since CSS spin was active, the visual rotation is unknown to JS.
            // This is the tricky part of "infinite to fixed".
            // simplified: We accept a visual "jump" or we don't use CSS animation.
            // BETTER APPROACH: Don't use CSS animation. 
            // Use a fast JS interval or just setting a huge rotation initially?
            // "Tarda en iniciar": We can set a "pre-spin" rotation immediately.

            // Let's skip the complicated sync. We will just use the standard animation 
            // but trigger it immediately with a placeholder, then `update` it? No, transition is css.

            // REFINED APPROACH:
            // 1. Click -> `setRotation(rotation + 3000)` (Fast spin)
            // 2. API returns -> calculate REAL target. `setRotation(realTarget)`
            // This relies on CSS handling the change mid-flight.

            // Actually, the user complained about "Tarda el boton en girar".
            // This means the `rotation` state update was delayed by `await fetch`.
            // So:

            // We've already started `setIsInfiniteSpinning(true)`.
            // Let's assume that spins visually via CSS class.
            // When we turn it off, we set `rotation` to something that continues the motion.
            // This might jump.

            // Let's try the simpler fix: 
            // 1. `setRotation` to a "warmup" value immediately.
            // 2. Then overwrite it with final.

            // But CSS transition duration is fixed (5s).
            // If we change target mid-way, it might look weird.

            // Let's stick with: CSS Spin Class (fake) -> Remove Class -> Set Final Rotation.
            // We need to `setRotation` to a value that is "far ahead" so it keeps spinning decel.
            // We can assume the CSS spin did ~2-3 turns.
            // Let's add 1080 to current `rotation` as a base + `dist`.

            setRotation(prev => {
                const base = prev + 1440 // 4 spins minimum
                return base + dist
            })

            // 3. Wait for animation
            await new Promise(resolve => setTimeout(resolve, 5000))

            // 4. Show Result
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

        } catch (error) {
            console.error("[MicroGameRoulette] Critical Spin Error", error)
            setSpinning(false)
            setIsInfiniteSpinning(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-[320px] mx-auto">
            {/* Prize Result Banner - Non-blocking */}
            {hasSpun && finalPrize && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: -20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    key={finalPrize} // Re-animate on new prize
                    className="mb-8 w-full bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl text-center relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                    <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold mb-1">¡Ganaste!</p>
                    <h3 className="text-2xl font-black text-white drop-shadow-md">{finalPrize}</h3>
                </motion.div>
            )}

            <div className="relative w-80 h-80 md:w-96 md:h-96 mb-10 group">
                {/* Outer Glow Ring (Static) */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-xl pointer-events-none" />

                {/* Decorative Outer Ring */}
                <div className="absolute -inset-4 rounded-full border border-white/5 border-t-white/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]" />

                {/* Pointer - Cyan Triangle with neon glow */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]">
                    <div className="w-0 h-0 border-l-[18px] border-l-transparent border-t-[32px] border-t-cyan-400 border-r-[18px] border-r-transparent animate-pulse"></div>
                </div>

                {/* Wheel Container */}
                <div
                    className={`w-full h-full rounded-full border-[10px] border-[#0F0F13] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden bg-[#1a1a1a] ${isInfiniteSpinning ? 'animate-spin-fast' : ''}`}
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: isInfiniteSpinning ? 'none' : 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)'
                    }}
                >
                    {/* Render Segments */}
                    {prizesToUse.map((prize, index) => {
                        const numSegments = prizesToUse.length
                        const angle = 360 / numSegments
                        const rotate = angle * index
                        // Calculate clip-path to make a perfect wedge
                        const halfAngleRad = (angle / 2) * (Math.PI / 180)
                        const tanVal = Math.tan(halfAngleRad)
                        const xOffset = 50 * tanVal
                        const xLeft = 50 - xOffset
                        const xRight = 50 + xOffset
                        const clipPath = `polygon(50% 100%, ${xLeft}% 0, ${xRight}% 0)`

                        return (
                            <div
                                key={index}
                                className="absolute top-0 left-1/2 w-full h-[50%] origin-bottom"
                                style={{
                                    transform: `translateX(-50%) rotate(${rotate}deg)`,
                                    clipPath: clipPath
                                }}
                            >
                                {/* Segment Color with 3D Gradient Overlay */}
                                <div
                                    className="w-full h-full absolute top-0 left-0"
                                    style={{
                                        backgroundColor: prize.color,
                                        backgroundImage: `
                                            radial-gradient(circle at 50% 100%, rgba(0,0,0,0.6) 0%, transparent 60%),
                                            linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(255,255,255,0.1) 100%)
                                        `,
                                    }}
                                />
                                {/* Label with Glow */}
                                <div
                                    className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 origin-center text-white font-black text-[10px] sm:text-xs md:text-sm uppercase whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
                                    style={{
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
                disabled={spinning}
                className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-fuchsia-900/40 relative overflow-hidden group ${spinning
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                    }`}
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <span className="relative z-10 drop-shadow-md">{spinning ? 'Girando...' : '¡GIRAR AHORA!'}</span>
            </button>

            <style jsx>{`
                @keyframes spin-fast {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-fast {
                    animation: spin-fast 0.6s linear infinite;
                }
            `}</style>
        </div>
    )
}

'use client'

import { useState, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { Gift, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'

interface MicroGameRouletteProps {
    onPrizeWon: (prize: string) => void
}

const PRIZES = [
    { label: '10% Desc.', color: '#8b5cf6' }, // Violet
    { label: 'Refresco Gratis', color: '#ec4899' }, // Pink
    { label: 'Suerte la próxima', color: '#6b7280' }, // Gray
    { label: '2x1 Cerveza', color: '#eab308' }, // Yellow
    { label: 'Postre Gratis', color: '#22c55e' }, // Green
    { label: '5% Desc.', color: '#3b82f6' }, // Blue
]

export default function MicroGameRoulette({ onPrizeWon }: MicroGameRouletteProps) {
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
        const segmentAngle = 360 / PRIZES.length
        // Pick a random winning index (usually you'd control this via backend probabilities)
        // For demo, let's avoid "Suerte la próxima" (index 2) slightly to be nice, but keep it random
        let winningIndex = Math.floor(Math.random() * PRIZES.length)

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
        const prize = PRIZES[winningIdx]

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
        <div className="flex flex-col items-center justify-center p-4">
            {!hasSpun ? (
                <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
                        ¡Gira la Ruleta Ganadora!
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">Gana premios instantáneos por tu opinión</p>
                </div>
            ) : (
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center mb-6 p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md"
                >
                    <p className="text-gray-300 text-sm uppercase tracking-wider mb-1">Tu Premio:</p>
                    <h3 className="text-3xl font-black text-white glow-text">{finalPrize}</h3>
                    <div className="mt-2 text-xs text-gray-400">Muestra esto al cajero para canjear.</div>
                </motion.div>
            )}

            <div className="relative w-64 h-64 md:w-80 md:h-80">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20">
                    <div className="w-0 h-0 border-l-[15px] border-l-transparent border-t-[30px] border-t-white border-r-[15px] border-r-transparent drop-shadow-lg"></div>
                </div>

                {/* Wheel Container */}
                <div
                    className="w-full h-full rounded-full border-4 border-white/20 shadow-2xl relative overflow-hidden"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)'
                    }}
                >
                    {/* Render Segments */}
                    {PRIZES.map((prize, index) => {
                        const angle = 360 / PRIZES.length
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
                                {/* Segment Color */}
                                <div
                                    className="w-full h-full absolute top-0 left-0"
                                    style={{
                                        backgroundColor: prize.color,
                                        transform: `rotate(${90 - (angle / 2)}deg)` // Adjust for clip-path visualization
                                    }}
                                />
                                {/* Label */}
                                <div
                                    className="absolute top-8 left-1/2 -translate-x-1/2 text-white font-bold text-xs md:text-sm uppercase whitespace-nowrap"
                                    style={{ transform: 'rotate(90deg)' }} // Text pointing outwards
                                >
                                    {prize.label}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg z-10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-violet-600 fill-violet-600" />
                </div>
            </div>

            <button
                onClick={handleSpin}
                disabled={spinning || hasSpun}
                className={`mt-8 px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-lg ${spinning || hasSpun
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-violet-600/50'
                    }`}
            >
                {spinning ? 'Girando...' : hasSpun ? '¡Premio Canjeado!' : 'GIRAR AHORA'}
            </button>
        </div>
    )
}

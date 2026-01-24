'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, X, RotateCw, RefreshCw } from 'lucide-react'

interface SpicyBottleProps {
    customActions?: string[]
    customBottleUrl?: string | null
}

const DEFAULT_ACTIONS = [
    "¡Bebe un shot de tequila!",
    "Confiesa tu mayor secreto.",
    "Dale un beso a la persona de tu derecha.",
    "Baila sin música por 30 segundos.",
    "El grupo elige qué bebes.",
    "¡Verdad o Reto!",
    "Invita una ronda de shots.",
    "Cuenta un chiste o bebe.",
]

export default function SpicyBottle({ customActions = DEFAULT_ACTIONS, customBottleUrl }: SpicyBottleProps) {
    const [players, setPlayers] = useState<string[]>([])
    const [newPlayer, setNewPlayer] = useState('')
    const [isPlaying, setIsPlaying] = useState(false)
    const [spinning, setSpinning] = useState(false)
    const [rotation, setRotation] = useState(0)
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
    const [currentAction, setCurrentAction] = useState<string | null>(null)

    // Ensure we don't pick the same player twice in a row if possible
    const lastPlayerRef = useRef<string | null>(null)
    const lastActionRef = useRef<string | null>(null)

    const addPlayer = () => {
        if (newPlayer.trim() && !players.includes(newPlayer.trim())) {
            setPlayers([...players, newPlayer.trim()])
            setNewPlayer('')
        }
    }

    const startGame = () => {
        if (players.length >= 2) {
            setIsPlaying(true)
        }
    }

    const spinBottle = () => {
        if (spinning) return
        setSpinning(true)
        setSelectedPlayer(null)
        setCurrentAction(null)

        // 1. Determine Target Player
        let availablePlayers = players.filter(p => p !== lastPlayerRef.current)
        if (availablePlayers.length === 0) availablePlayers = players // Fallback if only 1 player or edge case
        const nextPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)]
        lastPlayerRef.current = nextPlayer

        // 2. Determine Action
        let availableActions = customActions.filter(a => a !== lastActionRef.current)
        if (availableActions.length === 0) availableActions = customActions
        const nextAction = availableActions[Math.floor(Math.random() * availableActions.length)]
        lastActionRef.current = nextAction

        // 3. Calculate Rotation
        // Visual logic need not be perfect mapping to player position since it's just a fun randomizer
        // But to make it cool, we just spin it a lot.
        const spinAmount = 1440 + Math.random() * 720 // 4-6 full spins
        const newRotation = rotation + spinAmount

        setRotation(newRotation)

        // 4. End Spin
        setTimeout(() => {
            setSpinning(false)
            setSelectedPlayer(nextPlayer)
            setCurrentAction(nextAction)
        }, 3000)
    }

    const resetGame = () => {
        setIsPlaying(false)
        setPlayers([])
        setRotation(0)
        lastPlayerRef.current = null
        lastActionRef.current = null
    }

    if (!isPlaying) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center space-y-2">
                        <Users className="w-12 h-12 text-violet-400 mx-auto" />
                        <h3 className="text-xl font-bold text-white">Jugadores</h3>
                        <p className="text-sm text-gray-400">Agrega a los participantes para comenzar.</p>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newPlayer}
                            onChange={(e) => setNewPlayer(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                            placeholder="Nombre..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                        <button
                            onClick={addPlayer}
                            disabled={!newPlayer.trim()}
                            className="p-3 bg-violet-600 rounded-xl text-white disabled:opacity-50 hover:bg-violet-500 transition"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                        <AnimatePresence>
                            {players.map((player) => (
                                <motion.div
                                    key={player}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"
                                >
                                    <span className="font-medium text-white">{player}</span>
                                    <button
                                        onClick={() => setPlayers(players.filter(p => p !== player))}
                                        className="text-gray-500 hover:text-red-400 transition"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {players.length === 0 && (
                            <p className="text-center text-xs text-gray-600 py-4 italic">No hay jugadores aún</p>
                        )}
                    </div>

                    <button
                        onClick={startGame}
                        disabled={players.length < 2}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-bold text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] transition-transform"
                    >
                        Comenzar Juego ({players.length})
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative p-4 min-h-[400px]">
            {/* Table / Bottle Area */}
            <div className="relative w-full max-w-[340px] aspect-square rounded-full border-4 border-white/10 flex items-center justify-center bg-white/5 shadow-[0_0_50px_rgba(139,92,246,0.1)] mb-12">

                {/* Players Circle */}
                {players.map((player, idx) => {
                    const angle = (idx / players.length) * 360
                    // Use percentages for positioning
                    // Radius = 42% (to keep them effectively inside/on edge of the 50% circle)
                    const radius = 42
                    const x = radius * Math.cos((angle - 90) * (Math.PI / 180))
                    const y = radius * Math.sin((angle - 90) * (Math.PI / 180))

                    return (
                        <div
                            key={player}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-10"
                            style={{
                                left: `${50 + x}%`,
                                top: `${50 + y}%`,
                            }}
                        >
                            <div className={`w-3 h-3 rounded-full ${selectedPlayer === player ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'bg-gray-600'}`} />
                            <span className={`text-[10px] md:text-xs font-bold ${selectedPlayer === player ? 'text-amber-400 bg-black/50 px-2 py-0.5 rounded-full' : 'text-gray-500'} whitespace-nowrap max-w-[80px] overflow-hidden text-ellipsis shadow-sm`}>
                                {player}
                            </span>
                        </div>
                    )
                })}

                {/* The Bottle */}
                <motion.div
                    className="relative w-[20%] h-[60%] filter drop-shadow-2xl z-0"
                    animate={{ rotate: rotation }}
                    transition={{
                        duration: 3,
                        ease: [0.2, 0.8, 0.2, 1], // Cubic bezier for realistic spin-down
                        type: "tween"
                    }}
                >
                    <div className="relative w-full h-full">
                        {/* Always Render SVG Bottle Base */}
                        <svg viewBox="0 0 100 300" className="w-full h-full overflow-visible drop-shadow-2xl">
                            <defs>
                                <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                                    <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                                </linearGradient>
                                <clipPath id="bottleClip">
                                    <path d="M30,0 L70,0 L80,50 L90,80 L90,280 C90,290 80,300 50,300 C20,300 10,290 10,280 L10,80 L20,50 L30,0 Z" />
                                </clipPath>
                            </defs>

                            {/* Bottle Body */}
                            <path d="M30,0 L70,0 L80,50 L90,80 L90,280 C90,290 80,300 50,300 C20,300 10,290 10,280 L10,80 L20,50 L30,0 Z" fill="#7c3aed" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

                            {/* Cork */}
                            <rect x="30" y="0" width="40" height="20" fill="#DAA520" />

                            {/* Label Area */}
                            {customBottleUrl ? (
                                <g clipPath="url(#bottleClip)">
                                    {/* White Label Background - Wrapped around */}
                                    <rect x="10" y="130" width="80" height="100" rx="2" fill="rgba(255,255,255,0.95)" />
                                    {/* Logo - Upright */}
                                    <image
                                        href={customBottleUrl}
                                        x="15"
                                        y="135"
                                        width="70"
                                        height="90"
                                        preserveAspectRatio="xMidYMid contain"
                                    />
                                </g>
                            ) : (
                                <text x="50" y="180" textAnchor="middle" fill="white" fontSize="16" transform="rotate(90, 50, 180)" fontWeight="bold" opacity="0.8">HAPPY</text>
                            )}

                            {/* Glass Shine Overlay */}
                            <path d="M30,0 L70,0 L80,50 L90,80 L90,280 C90,290 80,300 50,300 C20,300 10,290 10,280 L10,80 L20,50 L30,0 Z" fill="url(#glassGradient)" style={{ mixBlendMode: 'overlay' }} />
                        </svg>
                    </div>
                </motion.div>

            </div>

            {/* Controls */}
            <div className="text-center z-10 w-full px-4">
                <button
                    onClick={spinBottle}
                    disabled={spinning}
                    className="w-full max-w-xs py-4 bg-white text-black font-black text-xl rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {spinning ? "GIRANDO..." : "GIRAR BOTELLA 🍾"}
                </button>
            </div>

            {/* Result Overlay */}
            <AnimatePresence>
                {!spinning && selectedPlayer && currentAction && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-4 top-1/2 -translate-y-1/2 bg-black/90 border border-white/20 p-8 rounded-3xl text-center shadow-2xl backdrop-blur-xl z-50"
                    >
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 mb-2">
                            {selectedPlayer}
                        </h2>
                        <div className="w-16 h-1 bg-white/20 mx-auto rounded-full my-4" />
                        <p className="text-xl md:text-2xl text-white font-bold leading-tight">
                            {currentAction}
                        </p>

                        <button
                            onClick={spinBottle}
                            className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold text-white transition border border-white/10"
                        >
                            Girar de nuevo
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={resetGame}
                className="absolute top-4 left-4 p-2 text-white/50 hover:text-white"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
    )
}

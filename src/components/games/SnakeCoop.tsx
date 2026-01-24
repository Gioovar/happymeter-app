'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Users, ChefHat, Play, RotateCcw } from 'lucide-react'

// --- Constants ---
const CELL_SIZE = 20
const GRID_WIDTH = 20
const GRID_HEIGHT = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]
const INITIAL_SPEED = 150 // Faster for competitive

type ItemType = 'APPLE'
interface Position { x: number; y: number }
interface Item { pos: Position; type: ItemType; id: number }

interface SnakeCoopProps {
    venueName?: string
}

export default function SnakeCoop({ venueName = "HappyMeter" }: SnakeCoopProps) {

    // --- State ---
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'NEXT_PLAYER' | 'WINNER'>('START')
    const [score, setScore] = useState(0)
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0) // 0-based
    const [totalPlayers, setTotalPlayers] = useState(2)
    const [playerScores, setPlayerScores] = useState<number[]>([]) // Store final scores

    // Engine State
    const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
    const [items, setItems] = useState<Item[]>([])
    const [direction, setDirection] = useState<Position>({ x: 0, y: -1 })
    const nextDirection = useRef<Position>({ x: 0, y: -1 })

    // Refs
    const snakeRef = useRef(INITIAL_SNAKE)
    const itemsRef = useRef<Item[]>([])
    const scoreRef = useRef(0) // Fix: Track score in ref to avoid closure staleness
    const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

    // Sync
    useEffect(() => { snakeRef.current = snake }, [snake])
    useEffect(() => { itemsRef.current = items }, [items])

    // --- Helpers ---
    const getRandomPos = () => ({
        x: Math.floor(Math.random() * GRID_WIDTH),
        y: Math.floor(Math.random() * GRID_HEIGHT)
    })

    const spawnItem = () => {
        let pos = getRandomPos()
        while (snakeRef.current.some(s => s.x === pos.x && s.y === pos.y)) {
            pos = getRandomPos()
        }
        setItems([{ pos, type: 'APPLE', id: Date.now() }])
    }

    // --- Game Loop ---
    useEffect(() => {
        if (gameState !== 'PLAYING') {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current)
            return
        }

        const tick = () => {
            const currentHead = snakeRef.current[0]
            const currentDir = nextDirection.current
            const newHead = { x: currentHead.x + currentDir.x, y: currentHead.y + currentDir.y }

            setDirection(currentDir)

            // 1. Collision Check (Permadeath)
            let crashed = false
            if (newHead.x < 0 || newHead.x >= GRID_WIDTH || newHead.y < 0 || newHead.y >= GRID_HEIGHT) {
                crashed = true
            } else if (snakeRef.current.some(s => s.x === newHead.x && s.y === newHead.y)) {
                crashed = true
            }

            if (crashed) {
                handleDeath()
                return
            }

            // 2. Move
            const newSnake = [newHead, ...snakeRef.current]

            // 3. Eat
            const eatenIndex = itemsRef.current.findIndex(i => i.pos.x === newHead.x && i.pos.y === newHead.y)
            if (eatenIndex !== -1) {
                setItems([]) // Remove eaten
                scoreRef.current += 1 // Increment Ref
                setScore(scoreRef.current) // Sync State
                spawnItem()
            } else {
                newSnake.pop()
            }

            setSnake(newSnake)
        }

        const loop = setInterval(tick, INITIAL_SPEED)
        gameLoopRef.current = loop
        return () => clearInterval(loop)
    }, [gameState])

    // --- Logic ---
    const startTurn = () => {
        setSnake(INITIAL_SNAKE)
        setItems([])
        setScore(0)
        scoreRef.current = 0
        nextDirection.current = { x: 0, y: -1 }
        setDirection({ x: 0, y: -1 })
        spawnItem()
        setGameState('PLAYING')
    }

    const handleDeath = () => {
        // Save Score from Ref (ensure we take the max of state vs ref just in case, but ref is truth)
        const finalScore = scoreRef.current

        setPlayerScores(prev => {
            const newScores = [...prev]
            newScores[currentPlayerIndex] = finalScore
            return newScores
        })

        if (currentPlayerIndex < totalPlayers - 1) {
            setGameState('NEXT_PLAYER')
        } else {
            setGameState('WINNER')
        }
    }

    const nextPlayer = () => {
        setCurrentPlayerIndex(prev => prev + 1)
        startTurn()
    }

    const resetGame = () => {
        setCurrentPlayerIndex(0)
        setPlayerScores([])
        setScore(0)
        scoreRef.current = 0
        setGameState('START')
    }

    // --- Input ---
    const handleSwipe = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        const cur = nextDirection.current
        switch (dir) {
            case 'UP': if (cur.y !== 1) nextDirection.current = { x: 0, y: -1 }; break
            case 'DOWN': if (cur.y !== -1) nextDirection.current = { x: 0, y: 1 }; break
            case 'LEFT': if (cur.x !== 1) nextDirection.current = { x: -1, y: 0 }; break
            case 'RIGHT': if (cur.x !== -1) nextDirection.current = { x: 1, y: 0 }; break
        }
    }

    // Touch
    const touchStart = useRef<{ x: number, y: number } | null>(null)
    const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return
        const diffX = touchStart.current.x - e.changedTouches[0].clientX
        const diffY = touchStart.current.y - e.changedTouches[0].clientY
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > 30) handleSwipe(diffX > 0 ? 'LEFT' : 'RIGHT')
        } else {
            if (Math.abs(diffY) > 30) handleSwipe(diffY > 0 ? 'UP' : 'DOWN')
        }
        touchStart.current = null
    }

    // --- Render Helpers ---
    const getWinner = () => {
        if (playerScores.length === 0) return 0
        const maxScore = Math.max(...playerScores)
        return playerScores.indexOf(maxScore) + 1 // 1-based index
    }

    return (
        <div
            className="flex flex-col items-center justify-between w-full max-w-md mx-auto bg-black md:rounded-3xl overflow-hidden md:shadow-2xl relative md:border-4 border-b-4 border-cyan-500/50 md:shadow-[0_0_40px_rgba(6,182,212,0.3)] select-none text-white h-[85dvh] md:h-auto md:min-h-[600px]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Header */}
            <div className="w-full bg-black/50 p-4 flex justify-between items-center z-10 border-b border-white/10 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                    <Trophy className={`w-5 h-5 ${gameState === 'PLAYING' ? 'text-yellow-500' : 'text-gray-600'}`} />
                    <div>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-gray-500">Score</p>
                        <p className="text-xl font-black font-mono tracking-tighter leading-none">{score}</p>
                    </div>
                </div>

                {/* Active Player Indicator */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full border border-white/10 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                        <Users className="w-4 h-4 text-cyan-400" />
                        <span className="font-black text-sm text-cyan-500">P{currentPlayerIndex + 1}</span>
                    </div>
                </div>

                {/* Turn Info (Simplified) */}
                <div className="flex flex-col items-end">
                    <p className="text-[8px] uppercase tracking-widest font-bold text-gray-500">Players</p>
                    <p className="text-sm font-bold text-gray-400">{currentPlayerIndex + 1} / {totalPlayers}</p>
                </div>
            </div>

            {/* GRID Container */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-black min-h-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black pointer-events-none" />
                <div
                    style={{
                        display: 'grid', gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
                        gap: '1px', width: '100%', height: '100%', maxHeight: '100%', aspectRatio: '1/1', gridAutoRows: '1fr'
                    }}
                    className="relative z-10 object-contain max-w-[95%] max-h-[95%]"
                >
                    {Array.from({ length: GRID_HEIGHT * GRID_WIDTH }).map((_, i) => {
                        const x = i % GRID_WIDTH
                        const y = Math.floor(i / GRID_WIDTH)
                        const isBody = snake.some(s => s.x === x && s.y === y)
                        const isHead = snake[0].x === x && snake[0].y === y
                        const item = items.find(it => it.pos.x === x && it.pos.y === y)

                        if (isBody) {
                            return <div key={i} className={`w-full h-full ${isHead ? 'bg-white shadow-[0_0_10px_white] z-20 rounded-sm' : 'bg-green-500/90 shadow-[0_0_5px_#22c55e] rounded-[1px]'}`} />
                        }
                        if (item) {
                            return (
                                <div key={i} className="relative w-full h-full flex items-center justify-center">
                                    <div className="w-[60%] h-[60%] bg-fuchsia-500 rounded-full shadow-[0_0_10px_#d946ef] animate-pulse" />
                                </div>
                            )
                        }
                        return <div key={i} />
                    })}
                </div>
            </div>

            {/* Controls */}
            {gameState === 'PLAYING' && (
                <div className="w-full px-4 py-2 pb-6 grid grid-cols-3 gap-2 bg-black/90 backdrop-blur-md z-20 border-t border-cyan-500/20 shrink-0">
                    <div />
                    <NeonButton onClick={() => handleSwipe('UP')} rotate={0} />
                    <div />
                    <NeonButton onClick={() => handleSwipe('LEFT')} rotate={-90} />
                    <NeonButton onClick={() => handleSwipe('DOWN')} rotate={180} />
                    <NeonButton onClick={() => handleSwipe('RIGHT')} rotate={90} />
                    <div className="col-span-3 text-center mt-1"><p className="text-[10px] text-cyan-500 font-medium animate-pulse tracking-widest uppercase">SWIPE TO MOVE</p></div>
                </div>
            )}

            {/* MODALS */}
            <AnimatePresence>
                {/* START SCREEN */}
                {gameState === 'START' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-20 h-20 bg-black border-2 border-green-500 rounded-2xl mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-center">
                            <span className="text-5xl">🐍</span>
                        </div>
                        <h2 className="text-4xl font-black mb-2 tracking-tighter text-white">VIBORITA</h2>
                        <p className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-8">Competitive Mode</p>

                        <div className="flex items-center gap-6 mb-12 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl">
                            <button onClick={() => setTotalPlayers(p => Math.max(2, p - 1))} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 text-white">-</button>
                            <div className="flex flex-col">
                                <span className="text-4xl font-black text-white leading-none">{totalPlayers}</span>
                                <span className="text-[9px] uppercase font-bold text-gray-500 mt-1">Players</span>
                            </div>
                            <button onClick={() => setTotalPlayers(p => Math.min(10, p + 1))} className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 text-white">+</button>
                        </div>
                        <button onClick={startTurn} className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest rounded-xl text-lg shadow-[0_0_20px_rgba(34,197,94,0.4)] transition">
                            Start Match
                        </button>
                    </motion.div>
                )}

                {/* NEXT PLAYER */}
                {gameState === 'NEXT_PLAYER' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center">
                        <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-green-400 mb-8">ROUND OVER</h3>

                        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-2">Player {currentPlayerIndex + 1} Score</p>
                            <p className="text-5xl font-black text-white">{playerScores[currentPlayerIndex]}</p>
                        </div>

                        <div className="animate-bounce mb-8">
                            <p className="text-sm text-gray-400 uppercase tracking-widest mb-2">Next Up</p>
                            <p className="text-4xl font-black text-cyan-400">PLAYER {currentPlayerIndex + 2}</p>
                        </div>

                        <button onClick={nextPlayer} className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest rounded-xl text-lg shadow-[0_0_20px_rgba(34,211,238,0.4)] transition">
                            I'm Ready!
                        </button>
                    </motion.div>
                )}

                {/* WINNER SCREEN */}
                {gameState === 'WINNER' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black z-50 flex flex-col items-center justify-center p-6 text-center">
                        <Trophy className="w-16 h-16 text-yellow-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                        <h2 className="text-white text-lg font-bold uppercase tracking-widest opacity-80 mb-2">Winner!</h2>
                        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 mb-8">
                            PLAYER {getWinner()}
                        </h1>

                        <div className="w-full flex flex-col gap-2 mb-8 max-h-[150px] overflow-y-auto no-scrollbar">
                            {playerScores.map((s, i) => (
                                <div key={i} className={`flex justify-between p-3 rounded-lg ${i + 1 === getWinner() ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-white/5 border border-white/5'}`}>
                                    <span className={`font-bold ${i + 1 === getWinner() ? 'text-yellow-400' : 'text-gray-400'}`}>P{i + 1}</span>
                                    <span className="font-mono font-bold text-white">{s} pts</span>
                                </div>
                            ))}
                        </div>

                        {/* BRANDED CELEBRATION */}
                        <div className="w-full bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col items-center animate-pulse shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            <div className="bg-white/5 p-3 rounded-full mb-3">
                                <ChefHat className="w-8 h-8 text-white" />
                            </div>
                            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Congratulations from</p>
                            <p className="text-xl font-black text-white">{venueName}</p>
                        </div>

                        <div className="mt-8 flex gap-4 w-full">
                            <button onClick={resetGame} className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Rematch
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function NeonButton({ onClick, rotate }: { onClick: () => void, rotate: number }) {
    return (
        <button className="group relative w-16 h-16 flex items-center justify-center active:scale-95 transition-transform mx-auto" onPointerDown={onClick}>
            <div className="absolute inset-2 bg-cyan-600/20 blur-xl rounded-full opacity-50 group-active:opacity-80 transition-opacity" />
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] filter" style={{ transform: `rotate(${rotate}deg)` }}>
                <path d="M50 10 L90 50 L75 50 L75 90 L25 90 L25 50 L10 50 Z" fill="none" stroke="#22d3ee" strokeWidth="4" strokeLinejoin="round" className="opacity-50" />
                <path d="M50 10 L90 50 L75 50 L75 90 L25 90 L25 50 L10 50 Z" fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinejoin="round" className="drop-shadow-[0_0_5px_#22d3ee]" />
            </svg>
        </button>
    )
}

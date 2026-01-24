'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Timer, Trophy, Users, Star, Pizza } from 'lucide-react'

// --- Game Constants ---
const CELL_SIZE = 20
const GRID_WIDTH = 19
const GRID_HEIGHT = 21

// 0: Wall, 1: Food, 2: Empty
const INITIAL_MAZE = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 2, 2, 2, 2, 2, 2, 2, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 2, 0, 0, 2, 0, 0, 2, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 2, 1, 2, 2, 0, 2, 2, 2, 0, 2, 2, 1, 2, 2, 2, 2], // Ghost House Center
    [0, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0],
    [2, 2, 2, 0, 1, 0, 2, 2, 2, 2, 2, 2, 2, 0, 1, 0, 2, 2, 2],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
]

interface Position { x: number; y: number }

export default function PacManRestaurant() {

    // --- State ---
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PASS_TURN' | 'GAME_OVER' | 'FEEDBACK'>('START')
    const [familyScore, setFamilyScore] = useState(0)
    const [turnTime, setTurnTime] = useState(20)
    const [turnCount, setTurnCount] = useState(1)
    const [totalPlayers, setTotalPlayers] = useState(2)
    const [rating, setRating] = useState(0)

    // Engine State
    const [pacmanPos, setPacmanPos] = useState<Position>({ x: 9, y: 15 })
    const [ghosts, setGhosts] = useState<{ pos: Position, icon: string, dir: Position }[]>([
        { pos: { x: 9, y: 9 }, icon: '🍕', dir: { x: 1, y: 0 } },
        { pos: { x: 8, y: 9 }, icon: '🍔', dir: { x: -1, y: 0 } }
    ])

    const [grid, setGrid] = useState<number[][]>(INITIAL_MAZE.map(r => [...r]))
    const [direction, setDirection] = useState<Position>({ x: 0, y: 0 })
    const nextDirection = useRef<Position>({ x: 0, y: 0 })

    // --- Timers & Loop ---
    useEffect(() => {
        let gameInterval: NodeJS.Timeout

        if (gameState === 'PLAYING') {
            gameInterval = setInterval(() => {
                updateGameTick()
            }, 200)
        }

        return () => clearInterval(gameInterval)
    }, [gameState, pacmanPos, ghosts, direction])

    // --- Countdown ---
    useEffect(() => {
        let timerParams: NodeJS.Timeout
        if (gameState === 'PLAYING') {
            timerParams = setInterval(() => {
                setTurnTime(prev => {
                    if (prev <= 1) {
                        endTurn()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        }
        return () => clearInterval(timerParams)
    }, [gameState])

    // --- Input ---
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault()
            }
            if (gameState !== 'PLAYING') return
            switch (e.key) {
                case 'ArrowUp': nextDirection.current = { x: 0, y: -1 }; break
                case 'ArrowDown': nextDirection.current = { x: 0, y: 1 }; break
                case 'ArrowLeft': nextDirection.current = { x: -1, y: 0 }; break
                case 'ArrowRight': nextDirection.current = { x: 1, y: 0 }; break
            }
        }
        window.addEventListener('keydown', handleKeys)
        return () => window.removeEventListener('keydown', handleKeys)
    }, [gameState])

    // --- Logic ---
    const updateGameTick = () => {
        // 1. Determine Direction
        const desired = nextDirection.current
        let finalDir = direction

        if (isValidMove(pacmanPos.x + desired.x, pacmanPos.y + desired.y)) {
            finalDir = desired
        } else if (!isValidMove(pacmanPos.x + direction.x, pacmanPos.y + direction.y)) {
            finalDir = { x: 0, y: 0 }
        } else {
            finalDir = direction
        }

        setDirection(finalDir)

        // 2. Move Pacman
        let nextPos = { x: pacmanPos.x + finalDir.x, y: pacmanPos.y + finalDir.y }
        if (!isValidMove(nextPos.x, nextPos.y)) {
            nextPos = pacmanPos
        }
        setPacmanPos(nextPos)

        // 3. Eat
        if (grid[nextPos.y][nextPos.x] === 1) {
            const newGrid = [...grid]
            newGrid[nextPos.y] = [...newGrid[nextPos.y]]
            newGrid[nextPos.y][nextPos.x] = 2
            setGrid(newGrid)
            setFamilyScore(s => s + 10)
        }

        // 4. Move Ghosts
        const newGhosts = ghosts.map(g => {
            if (Math.random() > 0.7) {
                const dirs = [{ x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }]
                g.dir = dirs[Math.floor(Math.random() * dirs.length)]
            }
            let gx = g.pos.x + g.dir.x
            let gy = g.pos.y + g.dir.y

            if (isValidMove(gx, gy)) {
                return { ...g, pos: { x: gx, y: gy } }
            } else {
                return { ...g, dir: { x: -g.dir.x, y: -g.dir.y } }
            }
        })
        setGhosts(newGhosts)

        // 5. Collision
        newGhosts.forEach(g => {
            if (g.pos.x === nextPos.x && g.pos.y === nextPos.y) {
                endTurn()
            }
        })
    }

    const isValidMove = (x: number, y: number) => {
        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false
        return INITIAL_MAZE[y][x] !== 0
    }

    const startTurn = () => {
        setGameState('PLAYING')
        setTurnTime(20)
        setPacmanPos({ x: 9, y: 15 })
        // Reset Ghosts to home to prevent spawn kill
        setGhosts([
            { pos: { x: 9, y: 9 }, icon: '🍕', dir: { x: 1, y: 0 } },
            { pos: { x: 8, y: 9 }, icon: '🍔', dir: { x: -1, y: 0 } }
        ])
        setDirection({ x: 0, y: 0 })
        nextDirection.current = { x: 0, y: 0 }
    }

    const endTurn = () => {
        setGameState('PASS_TURN')
        setTurnCount(c => c + 1)
    }

    const resetGame = () => {
        setFamilyScore(0)
        setTurnCount(1)
        setRating(0)
        setGrid(INITIAL_MAZE.map(r => [...r]))
        setGhosts([
            { pos: { x: 9, y: 9 }, icon: '🍕', dir: { x: 1, y: 0 } },
            { pos: { x: 8, y: 9 }, icon: '🍔', dir: { x: -1, y: 0 } }
        ])
        setGameState('START')
    }

    const touchStart = useRef<{ x: number, y: number } | null>(null)

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return
        const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }

        const diffX = touchStart.current.x - touchEnd.x
        const diffY = touchStart.current.y - touchEnd.y

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal
            if (Math.abs(diffX) > 30) {
                nextDirection.current = diffX > 0 ? { x: -1, y: 0 } : { x: 1, y: 0 }
            }
        } else {
            // Vertical
            if (Math.abs(diffY) > 30) {
                nextDirection.current = diffY > 0 ? { x: 0, y: -1 } : { x: 0, y: 1 }
            }
        }
        touchStart.current = null
    }

    const handleTouch = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        if (gameState !== 'PLAYING') return
        switch (dir) {
            case 'UP': nextDirection.current = { x: 0, y: -1 }; break
            case 'DOWN': nextDirection.current = { x: 0, y: 1 }; break
            case 'LEFT': nextDirection.current = { x: -1, y: 0 }; break
            case 'RIGHT': nextDirection.current = { x: 1, y: 0 }; break
        }
    }

    const currentPlayer = ((turnCount - 1) % totalPlayers) + 1

    return (
        <div
            className="flex flex-col items-center justify-center min-h-[500px] w-full max-w-md mx-auto bg-slate-900 rounded-2xl overflow-hidden shadow-2xl relative border border-slate-700 select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >

            {/* Header */}
            <div className="w-full bg-slate-800 p-4 flex justify-between items-center z-10 shadow-md">
                <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Puntaje</p>
                        <p className="text-xl font-black text-white">{familyScore}</p>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Jugador</p>
                    <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-400" />
                        <span className="text-white font-bold">{currentPlayer}/{totalPlayers}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Timer className={`w-5 h-5 ${turnTime < 5 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
                    <p className={`text-2xl font-mono font-bold ${turnTime < 5 ? 'text-red-500' : 'text-white'}`}>{turnTime}s</p>
                </div>
            </div>

            {/* DOM GRID RENDERER */}
            <div className="relative p-2 bg-black flex-1 flex items-center justify-center overflow-hidden">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
                        gap: '1px',
                        width: '100%',
                        maxWidth: '350px',
                        aspectRatio: `${GRID_WIDTH}/${GRID_HEIGHT}`
                    }}
                >
                    {grid.map((row, y) => (
                        row.map((cell, x) => {
                            const isPacman = pacmanPos.x === x && pacmanPos.y === y
                            const ghost = ghosts.find(g => g.pos.x === x && g.pos.y === y)
                            const isWall = INITIAL_MAZE[y][x] === 0
                            const isFood = cell === 1

                            return (
                                <div
                                    key={`${x}-${y}`}
                                    className={`
                                        w-full h-full relative flex items-center justify-center
                                        ${isWall ? 'border-[0.5px] border-blue-600/50 bg-slate-900/50 shadow-[0_0_2px_rgba(37,99,235,0.3)]' : ''}
                                        ${isWall && (x === 0 || x === GRID_WIDTH - 1 || y === 0 || y === GRID_HEIGHT - 1) ? 'border-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.6)]' : ''}
                                    `}
                                >
                                    {isWall && <div className="w-1/2 h-1/2 border border-blue-800/30 rounded-sm" />}

                                    {isFood && !isPacman && !ghost && (
                                        <div className="w-1 h-1 bg-pink-200/80 rounded animate-pulse" />
                                    )}

                                    {isPacman && (
                                        <div className="relative w-full h-full flex items-center justify-center z-10">
                                            <div className="w-[85%] h-[85%] bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-pulse" />
                                        </div>
                                    )}

                                    {ghost && (
                                        <div className="text-base leading-none z-20 drop-shadow-md filter grayscale-[0.2]">
                                            {ghost.icon}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ))}
                </div>

                {gameState === 'PLAYING' && turnTime > 18 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="bg-black/60 px-4 py-2 rounded-full text-white font-bold animate-pulse backdrop-blur-md border border-white/10">
                            👆 Desliza para moverte
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Overlay (Enlarged & Neon) */}
            {gameState === 'PLAYING' && (
                <div className="w-full p-6 grid grid-cols-3 gap-4 bg-slate-900/80 backdrop-blur-md z-20 border-t border-white/5 pb-10">
                    <div />
                    <NeonButton onClick={() => handleTouch('UP')} rotate={0} />
                    <div />
                    <NeonButton onClick={() => handleTouch('LEFT')} rotate={-90} />
                    <NeonButton onClick={() => handleTouch('DOWN')} rotate={180} />
                    <NeonButton onClick={() => handleTouch('RIGHT')} rotate={90} />

                    <div className="col-span-3 text-center mt-4">
                        <p className="text-xs text-purple-300 font-medium animate-pulse">Tocá las flechas o desliza</p>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {gameState === 'START' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-50"
                    >
                        <Pizza className="w-16 h-16 text-yellow-400 mb-4 animate-bounce" />
                        <h2 className="text-3xl font-black text-white mb-2">PAC-CHEF</h2>
                        <p className="text-slate-300 mb-6 text-sm">¡Coman todos los ingredientes!</p>

                        {/* Player Selector */}
                        <div className="mb-6 bg-white/5 p-4 rounded-xl w-full border border-white/10">
                            <p className="text-slate-400 text-xs uppercase font-bold mb-3 tracking-wider">¿Cuántos van a jugar?</p>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setTotalPlayers(p => Math.max(1, p - 1))}
                                    className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition text-xl font-bold"
                                >
                                    -
                                </button>
                                <div className="flex flex-col items-center w-16">
                                    <span className="text-3xl font-black text-white">{totalPlayers}</span>
                                    <span className="text-[10px] text-slate-500">Personas</span>
                                </div>
                                <button
                                    onClick={() => setTotalPlayers(p => Math.min(10, p + 1))}
                                    className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition text-xl font-bold"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4 w-full">
                            <button
                                onClick={startTurn}
                                className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl text-lg shadow-lg active:scale-95 transition uppercase tracking-wide"
                            >
                                ¡Comenzar!
                            </button>
                            <div className="bg-white/10 p-3 rounded-lg text-xs text-left text-slate-400 flex flex-col gap-1">
                                <p>🔵 <span className="text-white">Paredes</span></p>
                                <p>🍕 <span className="text-white">¡Huye de la Comida!</span></p>
                                <p>👥 <span className="text-white">Puntaje Cooperativo</span></p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {gameState === 'PASS_TURN' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-8 text-center z-50"
                    >
                        <Users className="w-16 h-16 text-blue-400 mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">¡Tiempo Fuera!</h3>
                        <p className="text-lg text-slate-300 mb-8">
                            Pásale el teléfono al<br />
                            <span className="text-yellow-400 font-black text-2xl">JUGADOR {(turnCount % totalPlayers) + 1}</span>
                        </p>
                        <div className="space-y-3 w-full">
                            <button
                                onClick={startTurn}
                                className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl shadow-lg active:scale-95 transition"
                            >
                                ¡Listo! Continuar ▶️
                            </button>
                            <button
                                onClick={() => setGameState('FEEDBACK')}
                                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-400 font-bold rounded-xl transition"
                            >
                                Terminar Partida
                            </button>
                        </div>
                    </motion.div>
                )}

                {gameState === 'FEEDBACK' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-8 text-center z-50 overflow-y-auto"
                    >
                        <h3 className="text-2xl font-bold text-white mb-6">¡Gracias por jugar!</h3>

                        <div className="glass-card p-6 rounded-2xl bg-white/5 border border-white/10 mb-8 w-full">
                            <p className="text-sm text-slate-400 mb-4 uppercase tracking-wider font-bold">Puntaje Final</p>
                            <p className="text-4xl font-black text-yellow-400">{familyScore}</p>
                        </div>

                        <div className="mb-6 w-full max-w-xs">
                            <p className="text-white font-medium mb-4">¿Cómo va su espera en el restaurante?</p>

                            <div className="flex gap-2 justify-center mb-4">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`transition-all ${rating >= star ? 'scale-110' : 'opacity-30 hover:opacity-100 hover:scale-110'}`}
                                    >
                                        <Star className={`w-8 h-8 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                placeholder="¿Algún comentario? (Opcional)"
                                className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-yellow-400 transition mb-4 resize-none h-20"
                            />

                            <button
                                onClick={() => {
                                    alert("¡Gracias por tu opinión! Se ha enviado al gerente.")
                                    resetGame()
                                }}
                                disabled={rating === 0}
                                className="w-full py-3 bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 text-black font-bold rounded-xl shadow-lg active:scale-95 transition"
                            >
                                Enviar Opinión 📨
                            </button>
                        </div>

                        <button
                            onClick={resetGame}
                            className="text-sm text-slate-400 underline hover:text-white pb-8"
                        >
                            Saltar y Volver al Menú
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    )
}

// --- Neon Button Component ---
function NeonButton({ onClick, rotate }: { onClick: () => void, rotate: number }) {
    return (
        <button
            className="group relative w-20 h-20 flex items-center justify-center active:scale-95 transition-transform"
            onPointerDown={onClick}
        >
            {/* Glow Background */}
            <div className="absolute inset-2 bg-fuchsia-600/20 blur-xl rounded-full opacity-50 group-active:opacity-80 transition-opacity" />

            {/* Arrow SVG */}
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-[0_0_8px_rgba(216,27,96,0.8)] filter"
                style={{ transform: `rotate(${rotate}deg)` }}
            >
                <path
                    d="M50 10 L90 50 L75 50 L75 90 L25 90 L25 50 L10 50 Z"
                    fill="none"
                    stroke="#e879f9"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    className="opacity-50"
                />
                <path
                    d="M50 10 L90 50 L75 50 L75 90 L25 90 L25 50 L10 50 Z"
                    fill="none"
                    stroke="#f0abfc"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_0_5px_#e879f9]"
                />
            </svg>
        </button>
    )
}

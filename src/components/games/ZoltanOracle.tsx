'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Stars, Send } from 'lucide-react'

// Asset Paths
const IMG_CABINET = '/assets/games/zoltan/cabinet.png'
const IMG_FACE = '/assets/games/zoltan/face.png'

interface ZoltanOracleProps {
    venueName?: string
}

export default function ZoltanOracle({ venueName = "El Café Místico" }: ZoltanOracleProps) {
    const [gameState, setGameState] = useState<'IDLE' | 'LISTENING' | 'THINKING' | 'CLARIFYING' | 'SPEAKING'>('IDLE')
    const [question, setQuestion] = useState('')
    const [topic, setTopic] = useState<'LOVE' | 'MONEY' | 'FUTURE' | null>(null)
    const [answer, setAnswer] = useState('')
    const [displayedAnswer, setDisplayedAnswer] = useState('')

    // Animation Refs
    const faceRef = useRef<HTMLImageElement>(null)

    // --- Logic ---
    const [previousContext, setPreviousContext] = useState<{ originalQuestion: string, clarificationQuestion?: string } | null>(null)

    // --- Logic ---
    const handleSelectTopic = (t: 'LOVE' | 'MONEY' | 'FUTURE') => {
        setTopic(t)
        setQuestion('')
        setPreviousContext(null)
        setGameState('LISTENING')
    }

    const askOracle = async () => {
        if (!topic) return
        setGameState('THINKING')

        // Determine Stage
        const currentStage = previousContext ? 'predict' : 'clarify'

        try {
            const res = await fetch('/api/games/oracle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    question,
                    venueName,
                    stage: currentStage,
                    context: previousContext
                })
            })
            const data = await res.json()

            if (data.answer) {
                if (currentStage === 'clarify') {
                    // Received Clarification Question -> Show it and ask for input
                    setAnswer(data.answer) // Zoltan speaks the question
                    setPreviousContext({ originalQuestion: question, clarificationQuestion: data.answer })
                    setGameState('CLARIFYING') // New state to show speech + input
                    setQuestion('') // Clear input for answer
                } else {
                    // Final Prediction
                    setAnswer(data.answer)
                    setGameState('SPEAKING')
                }
            } else {
                setAnswer("Las estrellas están nubladas... intenta de nuevo.")
                setGameState('SPEAKING')
            }
        } catch (e) {
            setAnswer("Mi conexión con el más allá es débil...")
            setGameState('SPEAKING')
        }
    }

    // --- Typewriter Effect ---
    useEffect(() => {
        if ((gameState === 'SPEAKING' || gameState === 'CLARIFYING') && answer) {
            let i = 0
            setDisplayedAnswer('')
            const interval = setInterval(() => {
                setDisplayedAnswer(prev => prev + answer.charAt(i))
                i++
                if (i >= answer.length) {
                    clearInterval(interval)
                    // If Speaking fininshed & it's final result, wait then IDLE
                    if (gameState === 'SPEAKING') {
                        setTimeout(() => setGameState('IDLE'), 15000)
                    }
                }
            }, 40) // Slightly faster
            return () => clearInterval(interval)
        }
    }, [gameState, answer])

    return (
        <div className="flex flex-col items-center justify-center min-h-[90dvh] w-full max-w-md mx-auto bg-[#1a0b00] rounded-3xl overflow-hidden shadow-2xl relative border-4 border-[#d4af37] text-white font-serif">

            {/* CABINET VISUALS */}
            <div className="relative w-full aspect-[3/4] bg-black overflow-hidden flex items-center justify-center">
                {/* Background (Cabinet) */}
                <img src={IMG_CABINET} alt="Zoltan Cabinet" className="absolute inset-0 w-full h-full object-cover z-0 opacity-80" />

                {/* Face (Animated) */}
                <motion.img
                    src={IMG_FACE}
                    alt="Zoltan Face"
                    className="relative z-10 w-2/3 object-contain drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                    animate={
                        gameState === 'THINKING' ? { scale: [1, 1.05, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } :
                            (gameState === 'SPEAKING' || gameState === 'CLARIFYING') ? { y: [0, 2, 0], filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'] } :
                                { opacity: 0.9 }
                    }
                    transition={{ repeat: Infinity, duration: gameState === 'THINKING' ? 2 : 0.5 }}
                />

                {/* Lighting Effects */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0b00] via-transparent to-transparent z-20" />
                {gameState === 'THINKING' && <div className="absolute inset-0 bg-purple-500/20 mix-blend-overlay z-20 animate-pulse" />}
            </div>

            {/* UI LAYER */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-30 bg-gradient-to-t from-black via-black/90 to-transparent min-h-[40%] flex flex-col justify-end">

                {/* STATE: IDLE (Selection) */}
                {gameState === 'IDLE' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
                        <h2 className="text-[#d4af37] text-2xl font-bold tracking-widest drop-shadow-md">EL GRAN ZOLTAN</h2>
                        <p className="text-gray-400 text-sm italic">¿Qué deseas saber, mortal?</p>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleSelectTopic('LOVE')} className="p-3 bg-[#3d0000] border border-[#d4af37]/30 rounded-lg hover:bg-[#590000] transition text-[#ff9999] font-bold text-xs uppercase tracking-wider">Amor ❤️</button>
                            <button onClick={() => handleSelectTopic('MONEY')} className="p-3 bg-[#0d1f0d] border border-[#d4af37]/30 rounded-lg hover:bg-[#1a3d1a] transition text-[#99ff99] font-bold text-xs uppercase tracking-wider">Dinero 💰</button>
                            <button onClick={() => handleSelectTopic('FUTURE')} className="p-3 bg-[#0d0d1f] border border-[#d4af37]/30 rounded-lg hover:bg-[#1a1a3d] transition text-[#9999ff] font-bold text-xs uppercase tracking-wider">Destino ✨</button>
                        </div>
                    </motion.div>
                )}

                {/* STATE: LISTENING (Initial Input) */}
                {gameState === 'LISTENING' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="text-center mb-2">
                            <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.2em] border-b border-[#d4af37] pb-1">Tema: {topic === 'LOVE' ? 'AMOR' : topic === 'MONEY' ? 'DINERO' : 'FUTURO'}</span>
                        </div>
                        <p className="text-center text-sm text-gray-300">Escribe tu pregunta...</p>
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="¿Encontraré...?"
                            className="w-full bg-white/5 border border-[#d4af37]/30 rounded-xl px-4 py-3 text-[#d4af37] placeholder-white/20 focus:outline-none focus:border-[#d4af37] text-center"
                        />
                        <button onClick={askOracle} disabled={!question} className="w-full py-3 bg-[#d4af37] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#f1c40f] disabled:opacity-50 transition flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" /> Consultar
                        </button>
                        <button onClick={() => setGameState('IDLE')} className="w-full text-xs text-gray-500 hover:text-gray-400">Regresar</button>
                    </motion.div>
                )}

                {/* STATE: THINKING */}
                {gameState === 'THINKING' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                        <Stars className="w-8 h-8 text-[#d4af37] mx-auto mb-4 animate-spin-slow" />
                        <p className="text-[#d4af37] font-serif italic text-lg animate-pulse">Consultando a los espíritus...</p>
                    </motion.div>
                )}

                {/* STATE: CLARIFYING (Zoltan Speaks + User Input) */}
                {gameState === 'CLARIFYING' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {/* Zoltan's Question */}
                        <div className="bg-black/60 p-3 rounded-xl border border-[#d4af37]/30">
                            <p className="text-[#f1c40f] font-serif italic text-center">"{displayedAnswer}"</p>
                        </div>

                        {/* User Answer Input - Only show when question finished typing or almost */}
                        {displayedAnswer.length > answer.length * 0.5 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    placeholder="Responde a Zoltan..."
                                    className="w-full bg-white/5 border border-[#d4af37]/30 rounded-xl px-4 py-3 text-[#d4af37] placeholder-white/20 focus:outline-none focus:border-[#d4af37] text-center"
                                />
                                <button onClick={askOracle} disabled={!question} className="w-full py-3 bg-[#d4af37] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#f1c40f] disabled:opacity-50 transition flex items-center justify-center gap-2">
                                    <Send className="w-4 h-4" /> Responder
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {/* STATE: SPEAKING (Final Result) */}
                {gameState === 'SPEAKING' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
                        <div className="max-h-[200px] overflow-y-auto no-scrollbar bg-black/40 p-4 rounded-xl border border-[#d4af37]/20">
                            <p className="text-[#f1c40f] font-serif text-lg leading-relaxed shadow-black drop-shadow-md">
                                "{displayedAnswer}"
                            </p>
                        </div>

                        {displayedAnswer.length === answer.length && (
                            <button onClick={() => setGameState('IDLE')} className="text-[#d4af37] text-xs uppercase tracking-widest border-b border-[#d4af37]/50 hover:text-white pb-0.5">Preguntar de nuevo</button>
                        )}
                    </motion.div>
                )}

            </div>
        </div>
    )
}

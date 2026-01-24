'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, Upload, Sparkles, RefreshCw } from 'lucide-react'

const IMG_GYPSY = '/assets/games/hand-reader/gypsy.png'

export default function MysticHandReader() {
    const [gameState, setGameState] = useState<'START' | 'SCANNING' | 'READING' | 'RESULT'>('START')
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [reading, setReading] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    // --- Logic ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImageSrc(reader.result as string)
                setGameState('SCANNING')
                analyzeHand(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const analyzeHand = async (base64Image: string) => {
        try {
            // Fake scanning delay for dramatic effect
            await new Promise(r => setTimeout(r, 2000))
            setGameState('READING')

            const res = await fetch('/api/games/hand-reader', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image }) // Send base64 directly
            })
            const data = await res.json()

            if (data.reading) {
                setReading(data.reading)
                setGameState('RESULT')
            } else {
                setReading("Las líneas son confusas... intenta con otra luz.")
                setGameState('RESULT')
            }
        } catch (e) {
            setReading("Los espíritus están inquietos... error de conexión.")
            setGameState('RESULT')
        }
    }

    const resetGame = () => {
        setGameState('START')
        setImageSrc(null)
        setReading('')
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[90dvh] w-full max-w-md mx-auto bg-[#1a0520] rounded-3xl overflow-hidden shadow-2xl relative border-4 border-[#9b59b6] text-white font-serif">

            {/* BACKGROUND / GYPSY */}
            <div className="absolute inset-0 z-0">
                <img src={IMG_GYPSY} alt="Mystic Gypsy" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0520] via-[#1a0520]/80 to-transparent" />
            </div>

            {/* UI CONTENT */}
            <div className="relative z-10 w-full p-6 flex flex-col items-center justify-center min-h-[500px]">

                {/* STATE: START */}
                {gameState === 'START' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
                        <h2 className="text-3xl font-bold text-[#e1bee7] drop-shadow-lg tracking-widest">LECTURA DE MANO</h2>
                        <p className="text-[#d1c4e9] italic max-w-xs mx-auto">
                            Déjame ver las líneas de tu destino. Sube una foto de tu palma...
                        </p>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-2 p-4 bg-[#4a148c] rounded-2xl border border-[#ea80fc]/50 hover:bg-[#6a1b9a] transition w-28"
                            >
                                <Camera className="w-8 h-8 text-[#ea80fc]" />
                                <span className="text-xs font-bold uppercase">Cámara</span>
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center gap-2 p-4 bg-[#311b92] rounded-2xl border border-[#b388ff]/50 hover:bg-[#4527a0] transition w-28"
                            >
                                <Upload className="w-8 h-8 text-[#b388ff]" />
                                <span className="text-xs font-bold uppercase">Subir</span>
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment" // Mobile camera hint
                            onChange={handleFileUpload}
                        />
                    </motion.div>
                )}

                {/* STATE: SCANNING */}
                {gameState === 'SCANNING' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center relative">
                        {imageSrc && (
                            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-[#ea80fc] shadow-[0_0_30px_#ea80fc]">
                                <img src={imageSrc} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-[#ea80fc]/20 animate-pulse" />
                                {/* Scanning Line */}
                                <motion.div
                                    className="absolute top-0 left-0 right-0 h-1 bg-white shadow-[0_0_10px_white]"
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                            </div>
                        )}
                        <p className="mt-4 text-[#ea80fc] font-bold animate-pulse">Analizando líneas de vida...</p>
                    </motion.div>
                )}

                {/* STATE: READING (Thinking) */}
                {gameState === 'READING' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                        <Sparkles className="w-12 h-12 text-[#ffd700] mx-auto mb-4 animate-spin-slow" />
                        <p className="text-[#ffd700] text-xl font-serif italic">"Mmm... interesante..."</p>
                    </motion.div>
                )}

                {/* STATE: RESULT */}
                {gameState === 'RESULT' && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-[#ea80fc]/30 max-w-sm">
                        <h3 className="text-[#ea80fc] font-bold mb-3 uppercase tracking-widest text-sm text-center border-b border-[#ea80fc]/30 pb-2">Tu Destino</h3>
                        <p className="text-gray-200 leading-relaxed font-serif text-center mb-6">
                            "{reading}"
                        </p>
                        <button onClick={resetGame} className="w-full py-3 bg-[#4a148c] rounded-xl hover:bg-[#6a1b9a] transition flex items-center justify-center gap-2 font-bold text-[#ea80fc]">
                            <RefreshCw className="w-4 h-4" /> Leer otra mano
                        </button>
                    </motion.div>
                )}

            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { X, Smartphone, Printer, Download, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'

interface GameQRModalProps {
    isOpen: boolean
    onClose: () => void
    gameTitle: string
    gameUrl: string // The URL the QR points to
}

export default function GameQRModal({ isOpen, onClose, gameTitle, gameUrl }: GameQRModalProps) {
    const [mode, setMode] = useState<'mobile' | 'print'>('mobile')

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#111] border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
                >
                    {/* Left: Preview Area */}
                    <div className="w-full md:w-1/2 p-8 bg-[#0a0a0a] flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5">
                        {/* Phone Preview Mockup */}
                        <div className="relative w-64 aspect-[9/16] bg-black rounded-[2rem] border-4 border-[#222] shadow-2xl overflow-hidden flex flex-col items-center justify-center">
                            {/* Screen Content */}
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-fuchsia-600 flex flex-col items-center justify-center text-center p-6 text-white">
                                <h3 className="text-xl font-bold mb-8 drop-shadow-md">{gameTitle}</h3>

                                <div className="p-4 bg-white rounded-xl shadow-lg">
                                    <QRCodeSVG
                                        value={gameUrl}
                                        size={140}
                                        bgColor={"#ffffff"}
                                        fgColor={"#000000"}
                                        level={"H"}
                                        includeMargin={false}
                                    />
                                </div>

                                <p className="mt-8 text-xs font-medium opacity-80 uppercase tracking-widest">Escanea para Jugar</p>
                            </div>
                        </div>
                        <p className="absolute bottom-4 left-8 text-xs text-gray-500">Vista Previa (Celular)</p>
                    </div>

                    {/* Right: Controls */}
                    <div className="w-full md:w-1/2 p-8 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-violet-500" /> Descargar Código QR
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mode Switcher */}
                        <div className="flex p-1 bg-white/5 rounded-xl mb-6">
                            <button
                                onClick={() => setMode('mobile')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${mode === 'mobile' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Smartphone className="w-4 h-4" /> Para Celular
                            </button>
                            <button
                                onClick={() => setMode('print')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition ${mode === 'print' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Printer className="w-4 h-4" /> Para Impresión
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-8">
                            <h4 className="text-blue-200 text-sm font-bold flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4" /> Formato Historia / Estado
                            </h4>
                            <p className="text-xs text-blue-300/80 leading-relaxed">
                                Diseño vertical (1080x1920px) listo para compartir en Instagram Stories, WhatsApp Status o enviar por chat.
                            </p>
                        </div>

                        <div className="mt-auto space-y-4">
                            <button className="w-full py-3.5 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition">
                                <Download className="w-5 h-5" /> Descargar Imagen
                            </button>

                            <p className="text-center text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                                ¿Cómo usar estos códigos? <span className="underline">Ver guía</span>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

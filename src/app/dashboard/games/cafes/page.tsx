'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Coffee, Brain, ExternalLink, QrCode, ArrowLeft, Gamepad2, Hand } from 'lucide-react'
import Link from 'next/link'
import GameContainer from '@/components/games/GameContainer'
import GameQRModal from '@/components/games/GameQRModal'
import ZoltanOracle from '@/components/games/ZoltanOracle'
import MysticHandReader from '@/components/games/MysticHandReader'

// Mock Data
const GAMES = [
    {
        id: 'zoltan',
        title: 'El Oráculo Místico',
        description: 'Entretenimiento interactivo donde la IA adivina la suerte de tus clientes.',
        icon: Sparkles,
        color: 'from-amber-500 to-purple-600',
        component: <ZoltanOracle />
    },
    {
        id: 'hand-reader',
        title: 'El Rincón de la Gitana',
        description: 'Lectura de mano con IA visual.',
        icon: Hand,
        color: 'from-purple-600 to-indigo-900',
        component: <MysticHandReader />
    },
    {
        id: 'trivia',
        title: 'Trivia del Café (Coming Soon)',
        description: 'Descuentos por conocimientos de café.',
        icon: Coffee,
        color: 'from-orange-700 to-brown-900',
        component: <div className="p-8 text-center text-gray-500">Próximamente...</div>
    },
    {
        id: 'memory',
        title: 'Memory Beans (Coming Soon)',
        description: 'Juego de memoria clásico.',
        icon: Brain,
        color: 'from-green-600 to-emerald-800',
        component: <div className="p-8 text-center text-gray-500">Próximamente...</div>
    }
]

export default function CafeGamesPage() {
    const [selectedGame, setSelectedGame] = useState<string | null>(null)
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)

    // Editor State
    const [title, setTitle] = useState("El Gran Zoltan")
    const [qrGameUrl, setQrGameUrl] = useState('')

    const activeGame = GAMES.find(g => g.id === selectedGame)

    const handlePublish = () => {
        setQrGameUrl(`https://happymeter.app/play/${activeGame?.id}`) // Use actual ID
        setIsQRModalOpen(true)
    }

    if (selectedGame && activeGame) {
        return (
            <div className="min-h-screen bg-black text-white p-6 relative">
                {/* Floating Back Button (Standardized) */}
                <button
                    onClick={() => setSelectedGame(null)}
                    className="absolute top-4 left-4 md:top-8 md:left-8 z-50 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="max-w-7xl mx-auto pt-12">
                    <GameContainer
                        title={title}
                        onTitleChange={setTitle}
                        description={activeGame.description}
                        onGenerateQR={handlePublish}
                    >
                        {activeGame.component}
                    </GameContainer>
                </div>

                <GameQRModal
                    isOpen={isQRModalOpen}
                    onClose={() => setIsQRModalOpen(false)}
                    gameTitle={title || activeGame.title}
                    gameUrl={qrGameUrl}
                />
            </div>
        )
    }

    // Gallery View
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/dashboard/games" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
                            <ArrowLeft className="w-4 h-4" /> Volver al Centro de Juegos
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Juegos de Cafetería ☕</h1>
                        <p className="text-gray-400">Entretenimiento casual para tus clientes mientras esperan su pedido.</p>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {GAMES.map((game) => (
                        <motion.button
                            key={game.id}
                            onClick={() => setSelectedGame(game.id)}
                            whileHover={{ y: -5 }}
                            className="group relative h-[300px] rounded-3xl overflow-hidden text-left bg-[#111] border border-white/10 hover:border-white/20 transition-colors"
                        >
                            {/* Gradient Background */}
                            <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${game.color} transition-opacity group-hover:opacity-30`} />

                            <div className="relative p-8 h-full flex flex-col">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                                    <game.icon className="w-6 h-6 text-white" />
                                </div>

                                <h3 className="text-2xl font-bold mb-2">{game.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-auto">{game.description}</p>

                                <div className="flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                                    <span>Configurar</span>
                                    <ArrowLeft className="w-4 h-4 rotate-180" />
                                </div>
                            </div>
                        </motion.button>
                    ))}

                    {/* "More Coming Soon" Card */}
                    <div className="h-[300px] rounded-3xl border border-white/5 bg-white/5 flex flex-col items-center justify-center text-center p-6 border-dashed">
                        <Gamepad2 className="w-10 h-10 text-gray-600 mb-4" />
                        <h3 className="text-lg font-bold text-gray-500">Más Juegos</h3>
                        <p className="text-gray-600 text-sm">Próximamente...</p>
                    </div>
                </div>

            </div>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { ArrowLeft, ChefHat, Pizza, Activity, Trophy } from 'lucide-react'
import Link from 'next/link'
import GameContainer from '@/components/games/GameContainer'
import PacManRestaurant from '@/components/games/PacManRestaurant'
import SnakeCoop from '@/components/games/SnakeCoop'
import GameQRModal from '@/components/games/GameQRModal'

// Game Definitions
const GAMES = [
    {
        id: 'pacman',
        title: 'Pac-Chef',
        description: 'Tus clientes ayudan al Chef a recolectar ingredientes. Versión cooperativa ideal para familias.',
        icon: Pizza, // Lucide Pizza
        emoji: '🍕', // Fallback/Alternative
        color: 'from-blue-600 to-indigo-600',
        component: PacManRestaurant
    },
    {
        id: 'snake',
        title: 'Viborita Coop',
        description: 'Juego cooperativo por turnos. Todos juegan con la misma víbora. ¡No mueres, solo te encoges!',
        icon: Activity, // Abstract for snake
        emoji: '🐍',
        color: 'from-green-500 to-emerald-700',
        component: SnakeCoop
    }
]

export default function RestaurantGamesPage() {
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)
    const [gameTitle, setGameTitle] = useState('')
    const [qrGameUrl, setQrGameUrl] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const handleSelectGame = (gameId: string) => {
        const game = GAMES.find(g => g.id === gameId)
        if (game) {
            setSelectedGameId(gameId)
            setGameTitle(game.title)
        }
    }

    const handlePublish = () => {
        const url = `https://happymeter.app/play/${selectedGameId}`
        setQrGameUrl(url)
        setIsQRModalOpen(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        setTimeout(() => {
            setIsSaving(false)
            alert("Configuración guardada (Simulación)")
        }, 1000)
    }

    const currentGame = GAMES.find(g => g.id === selectedGameId)

    // --- EDITOR MODE ---
    if (selectedGameId && currentGame) {
        const GameComponent = currentGame.component

        return (
            <div className="relative fade-in">
                {/* Floating Back Button */}
                <button
                    onClick={() => setSelectedGameId(null)}
                    className="absolute top-4 left-4 md:top-8 md:left-8 z-50 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <GameContainer
                    title={gameTitle}
                    description={currentGame.description}
                    onGenerateQR={handlePublish}
                    onTitleChange={setGameTitle}
                    onSave={handleSave}
                    isSaving={isSaving}
                    // Optional: We could inject game-specific settings here in the future
                    customSettings={
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-400" />
                                Configuración de Juego
                            </h3>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-sm text-gray-400">
                                <p>Este juego está optimizado para funcionar sin configuración. Simplemente publica el QR y los clientes podrán jugar inmediatamente.</p>
                            </div>
                        </div>
                    }
                >
                    {/* Game Preview */}
                    <div className="flex justify-center py-8">
                        <GameComponent />
                    </div>
                </GameContainer>

                <GameQRModal
                    isOpen={isQRModalOpen}
                    onClose={() => setIsQRModalOpen(false)}
                    gameTitle={gameTitle}
                    gameUrl={qrGameUrl}
                />
            </div>
        )
    }

    // --- GALLERY MODE ---
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-8">
                <Link href="/dashboard/games" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
                    <ArrowLeft className="w-4 h-4" /> Volver al Centro de Juegos
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                        <ChefHat className="w-8 h-8 text-orange-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                        Juegos para Restaurantes
                    </h1>
                </div>

                <p className="text-gray-400">
                    Selecciona una dinámica para activar en tu establecimiento.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GAMES.map((game) => (
                    <div
                        key={game.id}
                        onClick={() => handleSelectGame(game.id)}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-8 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange-500/10"
                    >
                        {/* Background Gradient */}
                        <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${game.color} opacity-10 blur-[60px] rounded-full group-hover:opacity-20 transition-opacity`} />

                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform relative overflow-hidden`}>
                            {/* Optional Emoji Overlay or Icon */}
                            <span className="text-3xl drop-shadow-md z-10">{game.emoji}</span>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
                        <p className="text-gray-400 mb-8 min-h-[48px] line-clamp-2">{game.description}</p>

                        <div className="flex items-center text-sm font-bold text-orange-400 group-hover:text-orange-300 transition-colors">
                            Jugar Ahora <ArrowLeft className="w-4 h-4 rotate-180 ml-2 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

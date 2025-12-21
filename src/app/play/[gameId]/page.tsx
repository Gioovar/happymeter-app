'use client'

import { useEffect, useState } from 'react'
import { notFound, useSearchParams } from 'next/navigation'
import PacManRestaurant from '@/components/games/PacManRestaurant'
import SnakeCoop from '@/components/games/SnakeCoop'
import ZoltanOracle from '@/components/games/ZoltanOracle'
import MysticHandReader from '@/components/games/MysticHandReader'
import CoupleDice from '@/components/games/CoupleDice'
import MicroGameRoulette from '@/components/MicroGameRoulette'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RouletteOutcome } from '@/types/game-roulette'

// Force dynamic to allow searchParams to work correctly in all environments
export const dynamic = 'force-dynamic'

interface PageProps {
    params: { gameId: string }
}

export default function PublicGamePage({ params }: PageProps) {
    const { gameId } = params
    const searchParams = useSearchParams()
    const uid = searchParams.get('uid')

    const [outcomes, setOutcomes] = useState<RouletteOutcome[]>([])
    const [pageConfig, setPageConfig] = useState<{ bannerUrl?: string, gameTitle?: string }>({})
    const [loadingConfig, setLoadingConfig] = useState(false)

    // Load config if needed (for roulette)
    useEffect(() => {
        if (gameId === 'roulette' && uid) {
            setLoadingConfig(true)
            fetch(`/api/games/config?userId=${uid}`) // We might need to adjust endpoint to accept query param
                .then(res => res.json())
                .then(data => {
                    if (data.roulette) setOutcomes(data.roulette)
                    // Set global branding config
                    setPageConfig({
                        bannerUrl: data.bannerUrl,
                        gameTitle: data.gameTitle
                    })
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingConfig(false))
        }
    }, [gameId, uid])

    // Verify valid games
    const validGames = ['pacman', 'snake', 'zoltan', 'hand-reader', 'couple-dice', 'roulette']

    if (!validGames.includes(gameId)) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Juego no encontrado 😕</h1>
                <p className="text-gray-400 mb-6">Lo sentimos, este juego no existe o el enlace es incorrecto.</p>
                <Link href="/" className="px-6 py-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition">
                    Ir al Inicio
                </Link>
            </div>
        )
    }

    // Special Layout for Roulette
    if (gameId === 'roulette') {
        if (!uid) {
            return (
                <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center text-white">
                    <h1 className="text-2xl font-bold mb-2">Enlace Incompleto</h1>
                    <p className="text-gray-400">Escanea el código QR nuevamente.</p>
                </div>
            )
        }

        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center overflow-x-hidden relative">
                {/* Background FX */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 pointer-events-none" />
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 blur-[100px] rounded-full" />

                {/* Header / Banner Area */}
                <div className="w-full relative z-10 p-4 pb-0 flex flex-col items-center">
                    {pageConfig.bannerUrl ? (
                        <div className="w-full max-w-md h-32 relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-6">
                            {/* Use classic img for dynamic external URLs to avoid domain config issues with Next/Image */}
                            <img
                                src={pageConfig.bannerUrl}
                                alt="Brand Banner"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        // Default Placeholder if no banner
                        <div className="w-full max-w-md h-24 relative rounded-2xl overflow-hidden flex items-center justify-center mb-6 bg-gradient-to-r from-violet-800 to-fuchsia-800">
                            <h1 className="text-xl font-bold text-white tracking-widest uppercase">{pageConfig.gameTitle || 'Ruleta Picante'}</h1>
                        </div>
                    )}
                </div>

                <div className="relative z-10 w-full max-w-md px-4 flex-1 flex flex-col justify-center min-h-[500px]">
                    {loadingConfig ? (
                        <div className="text-center text-white animate-pulse">Cargando premios...</div>
                    ) : (
                        <MicroGameRoulette
                            outcomes={outcomes}
                            onPrizeWon={() => { }}
                        />
                    )}
                </div>

                <div className="relative z-10 py-6 text-center w-full">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Powered by HappyMeter</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen flex flex-col relative overflow-hidden ${gameId === 'snake' ? 'bg-[#FDF6E3]' :
            gameId === 'zoltan' ? 'bg-[#1a0b00] text-[#d4af37]' :
                gameId === 'hand-reader' ? 'bg-[#1a0520] text-[#ea80fc]' :
                    gameId === 'couple-dice' ? 'bg-[#2a0a10] text-[#ffb3c1]' : // Dark Red/Pink theme
                        'bg-black'
            }`}>
            {/* Minimal Header */}
            <div className="p-4 flex items-center justify-between z-10 shrink-0">
                <Link href="/" className={`p-2 rounded-full hover:bg-white/20 transition backdrop-blur-md ${gameId === 'snake' ? 'bg-[#8B4513]/10 text-[#5D4037]' : 'bg-white/10 text-white'}`}>
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className={`px-4 py-1.5 rounded-full backdrop-blur-md border ${gameId === 'snake' ? 'bg-[#8B4513]/10 border-[#8B4513]/10' :
                    gameId === 'zoltan' ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' :
                        gameId === 'hand-reader' ? 'bg-[#4a148c]/20 border-[#ea80fc]/30 text-[#ea80fc]' :
                            gameId === 'couple-dice' ? 'bg-[#d00000]/20 border-[#ff4d6d]/30 text-[#ff4d6d]' :
                                'bg-white/5 border-white/5'
                    }`}>
                    <span className={`text-xs font-bold uppercase tracking-widest ${gameId === 'snake' ? 'text-[#8B4513]' :
                        gameId === 'zoltan' ? 'text-[#d4af37]' :
                            gameId === 'hand-reader' ? 'text-[#ea80fc]' :
                                gameId === 'couple-dice' ? 'text-[#ff4d6d]' :
                                    'text-gray-400'
                        }`}>
                        {gameId === 'zoltan' ? 'Mystic Corner 🔮' :
                            gameId === 'hand-reader' ? 'Quiromancia ✋' :
                                gameId === 'couple-dice' ? 'Modo Pasión 🔥' :
                                    'Modo Restaurante 🍽️'}
                    </span>
                </div>
                <div className="w-9" />
            </div>

            {/* Game Container */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0">
                {gameId === 'pacman' && <PacManRestaurant />}
                {gameId === 'snake' && <SnakeCoop />}
                {gameId === 'zoltan' && <ZoltanOracle />}
                {gameId === 'hand-reader' && <MysticHandReader />}
                {gameId === 'couple-dice' && <CoupleDice />}
            </div>

            {/* Footer / Branding */}
            <div className={`p-4 text-center text-[10px] shrink-0 ${gameId === 'zoltan' ? 'text-[#d4af37]/50' :
                gameId === 'hand-reader' ? 'text-[#ea80fc]/50' :
                    gameId === 'snake' ? 'text-[#8B4513]/50' :
                        gameId === 'couple-dice' ? 'text-[#ff4d6d]/50' :
                            'text-gray-600'
                }`}>
                Powered by HappyMeter
            </div>
        </div>
    )
}

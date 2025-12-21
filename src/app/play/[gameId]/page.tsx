'use client'

import { useEffect, useState } from 'react'
import { notFound, useSearchParams } from 'next/navigation'
import PacManRestaurant from '@/components/games/PacManRestaurant'
import SnakeCoop from '@/components/games/SnakeCoop'
import ZoltanOracle from '@/components/games/ZoltanOracle'
import MysticHandReader from '@/components/games/MysticHandReader'
import CoupleDice from '@/components/games/CoupleDice'
import MicroGameRoulette from '@/components/MicroGameRoulette'
import SpicyBottle from '@/components/games/SpicyBottle'
import TruthOrDare from '@/components/games/TruthOrDare'
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

    // Config states for other games
    const [bottleConfig, setBottleConfig] = useState<{ actions: string[], logo?: string }>({ actions: [], logo: undefined })
    const [truthConfig, setTruthConfig] = useState<{ truths: string[], dares: string[], extreme: string[] }>({ truths: [], dares: [], extreme: [] })

    const [pageConfig, setPageConfig] = useState<{ bannerUrl?: string, gameTitle?: string }>({})
    const [loadingConfig, setLoadingConfig] = useState(false)

    // Load config dynamic for any supported game that needs custom data
    useEffect(() => {
        if (!uid) return

        if (['roulette', 'bottle', 'truth'].includes(gameId)) {
            setLoadingConfig(true)
            fetch(`/api/games/config?userId=${uid}`)
                .then(res => res.json())
                .then(data => {
                    // Roulette
                    if (data.roulette) setOutcomes(data.roulette)

                    // Bottle
                    if (data.bottle) setBottleConfig(prev => ({ ...prev, actions: data.bottle }))
                    if (data.bottleLogo) setBottleConfig(prev => ({ ...prev, logo: data.bottleLogo }))

                    // Truth
                    if (data.truths) setTruthConfig(prev => ({ ...prev, truths: data.truths }))
                    if (data.dares) setTruthConfig(prev => ({ ...prev, dares: data.dares }))
                    if (data.extreme) setTruthConfig(prev => ({ ...prev, extreme: data.extreme }))

                    // Global branding
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
    const validGames = ['pacman', 'snake', 'zoltan', 'hand-reader', 'couple-dice', 'roulette', 'bottle', 'truth']

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

    // Special Layout for Bottle & Truth (Reusing Roulette container style for consistency)
    if (['roulette', 'bottle', 'truth'].includes(gameId)) {
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
                <div className="w-full relative z-10 p-4 pb-0 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700">
                    {pageConfig.bannerUrl ? (
                        <div className="w-full max-w-md h-32 relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-8 transform hover:scale-[1.02] transition-transform duration-500">
                            <img
                                src={pageConfig.bannerUrl}
                                alt="Brand Banner"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-full max-w-md h-24 relative rounded-2xl overflow-hidden flex items-center justify-center mb-8 bg-gradient-to-r from-violet-800 to-fuchsia-800 shadow-lg shadow-violet-900/50">
                            <h1 className="text-xl font-bold text-white tracking-widest uppercase">{pageConfig.gameTitle || 'Bar Games'}</h1>
                        </div>
                    )}

                    <div className="text-center space-y-2 mb-8 max-w-xs mx-auto">
                        <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 drop-shadow-sm">
                            {pageConfig.gameTitle || (gameId === 'bottle' ? 'Botella Picante' : gameId === 'truth' ? 'Verdad o Reto' : 'Ruleta Picante')}
                        </h1>
                    </div>
                </div>

                <div className="relative z-10 w-full max-w-md px-4 flex-1 flex flex-col justify-center min-h-[400px]">
                    {loadingConfig ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            <div className="text-white font-medium animate-pulse">Cargando partida...</div>
                        </div>
                    ) : (
                        <>
                            {gameId === 'roulette' && (
                                <MicroGameRoulette
                                    outcomes={outcomes}
                                    onPrizeWon={() => { }}
                                    gameOwnerId={uid || undefined}
                                />
                            )}
                            {gameId === 'bottle' && (
                                <SpicyBottle
                                    customActions={bottleConfig.actions.length > 0 ? bottleConfig.actions : undefined}
                                    customBottleUrl={bottleConfig.logo}
                                />
                            )}
                            {gameId === 'truth' && (
                                <TruthOrDare
                                    customTruths={truthConfig.truths.length > 0 ? truthConfig.truths : undefined}
                                    customDares={truthConfig.dares.length > 0 ? truthConfig.dares : undefined}
                                    customExtremeDares={truthConfig.extreme.length > 0 ? truthConfig.extreme : undefined}
                                />
                            )}
                        </>
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

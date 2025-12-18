'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import PacManRestaurant from '@/components/games/PacManRestaurant'
import SnakeCoop from '@/components/games/SnakeCoop'
import ZoltanOracle from '@/components/games/ZoltanOracle'
import MysticHandReader from '@/components/games/MysticHandReader'
import CoupleDice from '@/components/games/CoupleDice'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
    params: Promise<{ gameId: string }>
}

export default function PublicGamePage({ params }: PageProps) {
    const { gameId } = use(params)

    if (gameId !== 'pacman' && gameId !== 'snake' && gameId !== 'zoltan' && gameId !== 'hand-reader' && gameId !== 'couple-dice') {
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

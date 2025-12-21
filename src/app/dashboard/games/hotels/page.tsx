'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Heart, ArrowLeft, Gamepad2, Skull, BedDouble } from 'lucide-react'
import Link from 'next/link'
import GameContainer from '@/components/games/GameContainer'
import GameQRModal from '@/components/games/GameQRModal'
import CoupleDice from '@/components/games/CoupleDice'
import CoupleDiceSettings from '@/components/games/CoupleDiceSettings'
import {
    DiceItem,
    DEFAULT_STANDARD_ACTIONS,
    DEFAULT_STANDARD_BODY_PARTS,
    DEFAULT_EXTREME_ACTIONS,
    DEFAULT_EXTREME_BODY_PARTS
} from '@/types/game-couple'

// Game Definitions
const GAMES = [
    {
        id: 'couple-dice',
        title: 'Dados del Deseo',
        description: 'Juego picante para parejas. Deja que los dados decidan tu próxima caricia. Ideal para romper el hielo.',
        icon: Flame,
        emoji: '🎲',
        color: 'from-red-600 to-purple-800',
        component: CoupleDice
    },
    {
        id: 'romance-quiz',
        title: 'Quiz Romántico (Coming Soon)',
        description: '¿Qué tanto conoces a tu pareja? Preguntas profundas para conectar.',
        icon: Heart,
        emoji: '💘',
        color: 'from-pink-500 to-rose-400',
        component: () => <div className="p-8 text-center text-gray-500">Próximamente...</div>
    }
]

export default function HotelGamesPage() {
    const [selectedGame, setSelectedGame] = useState<string | null>(null)
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)
    const [title, setTitle] = useState("Dados del Pasión")
    const [qrGameUrl, setQrGameUrl] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // --- Couple Dice State ---
    const [cdIntensity, setCdIntensity] = useState<'standard' | 'extreme'>('standard')
    const [cdStandardActions, setCdStandardActions] = useState<DiceItem[]>(DEFAULT_STANDARD_ACTIONS)
    const [cdExtremeActions, setCdExtremeActions] = useState<DiceItem[]>(DEFAULT_EXTREME_ACTIONS)
    const [cdStandardParts, setCdStandardParts] = useState<DiceItem[]>(DEFAULT_STANDARD_BODY_PARTS)
    const [cdExtremeParts, setCdExtremeParts] = useState<DiceItem[]>(DEFAULT_EXTREME_BODY_PARTS)

    // Load saved config
    useState(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch('/api/games/config')
                if (res.ok) {
                    const data = await res.json()
                    // Merge saved config
                    const coupleData = data.coupleDice || {}
                    if (coupleData.intensity) setCdIntensity(coupleData.intensity)
                    if (coupleData.standardActions) setCdStandardActions(coupleData.standardActions)
                    if (coupleData.extremeActions) setCdExtremeActions(coupleData.extremeActions)
                    if (coupleData.standardBodyParts) setCdStandardParts(coupleData.standardBodyParts)
                    if (coupleData.extremeBodyParts) setCdExtremeParts(coupleData.extremeBodyParts)
                }
            } catch (error) {
                console.error("Failed to load game config", error)
            } finally {
                setIsLoading(false)
            }
        }
        loadConfig()
    })

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const configPayload = {
                coupleDice: {
                    intensity: cdIntensity,
                    standardActions: cdStandardActions,
                    extremeActions: cdExtremeActions,
                    standardBodyParts: cdStandardParts,
                    extremeBodyParts: cdExtremeParts
                }
            }

            const res = await fetch('/api/games/config', {
                method: 'POST',
                body: JSON.stringify(configPayload)
            })

            if (res.ok) {
                alert('¡Cambios guardados con éxito! 🔥')
            } else {
                alert('Error al guardar cambios.')
            }
        } catch (error) {
            alert('Error de conexión')
        } finally {
            setIsSaving(false)
        }
    }

    const handlePublish = () => {
        const activeGame = GAMES.find(g => g.id === selectedGame)
        setQrGameUrl(`https://happymeter-snowy.vercel.app/play/${activeGame?.id}`)
        setIsQRModalOpen(true)
    }

    const activeGame = GAMES.find(g => g.id === selectedGame)


    // --- EDITOR MODE ---
    if (selectedGame && activeGame) {

        let settingsComponent = null
        let gameProps = {}

        if (selectedGame === 'couple-dice') {
            gameProps = {
                standardActions: cdStandardActions,
                extremeActions: cdExtremeActions,
                standardBodyParts: cdStandardParts,
                extremeBodyParts: cdExtremeParts,
                // We don't force intensity here, so the preview shows the Menu -> Game flow
                // unless we want to force it. Let's force it only if 'cdIntensity' changes? 
                // No, let's let the admin verify the menu too. 
                initialIntensity: null
            }
            settingsComponent = (
                <CoupleDiceSettings
                    standardActions={cdStandardActions}
                    extremeActions={cdExtremeActions}
                    standardBodyParts={cdStandardParts}
                    extremeBodyParts={cdExtremeParts}
                    intensity={cdIntensity}
                    onUpdate={(sa, ea, sp, ep, int) => {
                        setCdStandardActions(sa)
                        setCdExtremeActions(ea)
                        setCdStandardParts(sp)
                        setCdExtremeParts(ep)
                        setCdIntensity(int)
                    }}
                />
            )
        }

        // @ts-ignore
        const GameComponent = activeGame.component

        return (
            <div className="min-h-screen bg-black text-white p-6 relative">
                {/* Floating Back Button */}
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
                        onSave={handleSave}
                        isSaving={isSaving}
                        customSettings={settingsComponent}
                    >
                        {/* @ts-ignore */}
                        <GameComponent {...gameProps} />
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

    // --- GALLERY MODE ---
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/dashboard/games" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
                            <ArrowLeft className="w-4 h-4" /> Volver al Centro de Juegos
                        </Link>
                        <h1 className="text-4xl font-black tracking-tight mb-2">Juegos para Hoteles 🏨</h1>
                        <p className="text-gray-400">Experiencias exclusivas para huéspedes, desde romance hasta relajación.</p>
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

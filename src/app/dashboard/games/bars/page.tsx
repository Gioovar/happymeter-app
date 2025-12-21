'use client'

import { useState } from 'react'
import { ArrowLeft, Flame, Beer, Users } from 'lucide-react'
import Link from 'next/link'
import GameContainer from '@/components/games/GameContainer'
import SpicyRoulette from '@/components/games/SpicyRoulette'
import SpicyBottle from '@/components/games/SpicyBottle'
import TruthOrDare from '@/components/games/TruthOrDare'
import RouletteSettings from '@/components/games/RouletteSettings'
import BottleSettings from '@/components/games/BottleSettings'
import TruthOrDareSettings from '@/components/games/TruthOrDareSettings'
import GameQRModal from '@/components/games/GameQRModal'
import { DEFAULT_ROULETTE_CONFIG, RouletteOutcome } from '@/types/game-roulette'

const GAMES = [
    {
        id: 'roulette',
        title: 'Ruleta Picante de Shots',
        description: 'Gira la ruleta y enfrenta el destino. ¿Beberás, invitarás o te salvarás?',
        icon: Beer,
        color: 'from-red-500 to-orange-500',
        component: SpicyRoulette
    },
    {
        id: 'bottle',
        title: 'Botella Picante',
        description: 'La botella decide quién es la próxima víctima. Retos, secretos y más.',
        icon: Flame,
        color: 'from-orange-500 to-amber-500',
        component: SpicyBottle
    },
    {
        id: 'truth',
        title: 'Verdad o Reto Extremo',
        description: '¿Te atreves a decir la verdad o prefieres un reto picante?',
        icon: Users,
        color: 'from-purple-600 to-pink-600',
        component: TruthOrDare
    }
]

const DEFAULT_BOTTLE_ACTIONS = [
    "¡Bebe un shot de tequila!",
    "Confiesa tu mayor secreto.",
    "Dale un beso a la persona de tu derecha.",
    "Baila sin música por 30 segundos.",
    "El grupo elige qué bebes.",
    "¡Verdad o Reto!",
    "Invita una ronda de shots.",
    "Cuenta un chiste o bebe.",
]

const DEFAULT_TRUTHS = [
    "¿Cuál es tu peor hábito al beber?",
    "¿Qué es lo más vergonzoso que has hecho en un bar?",
    "¿A quién de este grupo besarías?",
    "¿Cuál es tu fantasía secreta?",
    "¿Has sido infiel alguna vez?",
    "¿Qué es lo peor que le has dicho a una pareja?",
    "¿Muestra tu última foto de la galería.",
    "¿Cuánto es lo máximo que has gastado en una fiesta?"
]

const DEFAULT_DARES = [
    "Haz un baile sexy por 10 segundos.",
    "Déjate dar una nalgada por el jugador de la derecha.",
    "Bebe un shot sin manos.",
    "Intercambia una prenda con otro jugador.",
    "Habla con acento extranjero hasta tu próximo turno.",
    "Pide un trago con un nombre inventado al barman.",
    "Haz 10 sentadillas mientras bebes.",
    "Lame el cuello de la persona a tu izquierda."
]

const DEFAULT_EXTREME = [
    "🔥 EXTREMO: Beso de tres con dos jugadores a tu elección.",
    "🔥 EXTREMO: Body shot a la persona de enfrente.",
    "🔥 EXTREMO: Quítate dos prendas de ropa.",
    "🔥 EXTREMO: Envía un mensaje picante a tu ex.",
    "🔥 EXTREMO: Deja que el grupo prepare un shot 'especial' para ti."
]

export default function BarGamesPage() {
    const [selectedGame, setSelectedGame] = useState<string | null>(null)
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)
    const [rouletteOutcomes, setRouletteOutcomes] = useState<RouletteOutcome[]>(DEFAULT_ROULETTE_CONFIG)
    const [bottleActions, setBottleActions] = useState<string[]>(DEFAULT_BOTTLE_ACTIONS)
    const [bottleLogo, setBottleLogo] = useState<string | null>(null)

    // Truth or Dare State
    const [truths, setTruths] = useState<string[]>(DEFAULT_TRUTHS)
    const [dares, setDares] = useState<string[]>(DEFAULT_DARES)
    const [extremeDares, setExtremeDares] = useState<string[]>(DEFAULT_EXTREME)
    const [extremeInterval, setExtremeInterval] = useState<number>(8)

    const [isPublished, setIsPublished] = useState(false)
    const [gameTitle, setGameTitle] = useState('')
    const [userId, setUserId] = useState<string | null>(null) // To build the QR

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Load saved config & user ID
    useState(() => {
        const loadConfig = async () => {
            try {
                // Fetch user ID first (could use a dedicated endpoint or getting it from config endpoint wrapper)
                // Let's assume /api/games/config returns userId too or we fetch it separately.
                // Actually, let's fetch session info or just add userId to the config response for convenience.
                const res = await fetch('/api/games/config')
                if (res.ok) {
                    const data = await res.json()
                    if (data.userId) setUserId(data.userId) // We need to update API to return this

                    if (data.roulette) setRouletteOutcomes(data.roulette)
                    if (data.bottle) setBottleActions(data.bottle)
                    if (data.bottleLogo) setBottleLogo(data.bottleLogo)
                    if (data.truths) setTruths(data.truths)
                    if (data.dares) setDares(data.dares)
                    if (data.extreme) setExtremeDares(data.extreme)
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
                roulette: rouletteOutcomes,
                bottle: bottleActions,
                bottleLogo: bottleLogo,
                truths: truths,
                dares: dares,
                extreme: extremeDares
            }

            const res = await fetch('/api/games/config', {
                method: 'POST',
                body: JSON.stringify(configPayload)
            })

            if (res.ok) {
                alert('¡Cambios guardados con éxito! 💾')
            } else {
                alert('Error al guardar cambios.')
            }
        } catch (error) {
            console.error(error)
            alert('Error de conexión')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSelectGame = (gameId: string) => {
        const game = GAMES.find(g => g.id === gameId)
        if (game) {
            setSelectedGame(gameId)
            setGameTitle(game.title)
        }
    }

    const handlePublish = () => {
        setIsPublished(true)
        setIsQRModalOpen(true)
    }

    const currentGame = GAMES.find(g => g.id === selectedGame)

    if (selectedGame && currentGame) {
        const GameComponent = currentGame.component

        let gameProps = {}
        let settingsComponent = null

        if (selectedGame === 'roulette') {
            gameProps = { outcomes: rouletteOutcomes }
            settingsComponent = (
                <RouletteSettings
                    outcomes={rouletteOutcomes}
                    onChange={setRouletteOutcomes}
                />
            )
        } else if (selectedGame === 'bottle') {
            gameProps = { customActions: bottleActions, customBottleUrl: bottleLogo }
            settingsComponent = (
                <BottleSettings
                    actions={bottleActions}
                    onChange={setBottleActions}
                    logoUrl={bottleLogo}
                    onLogoChange={setBottleLogo}
                />
            )
        } else if (selectedGame === 'truth') {
            gameProps = { customTruths: truths, customDares: dares, customExtremeDares: extremeDares, extremeInterval }
            settingsComponent = (
                <TruthOrDareSettings
                    truths={truths}
                    dares={dares}
                    extremeDares={extremeDares}
                    extremeInterval={extremeInterval}
                    onChange={(newTruths, newDares, newExtreme, newInterval) => {
                        setTruths(newTruths)
                        setDares(newDares)
                        setExtremeDares(newExtreme)
                        setExtremeInterval(newInterval)
                    }}
                />
            )
        }

        return (
            <div className="relative fade-in">
                <button
                    onClick={() => setSelectedGame(null)}
                    className="absolute top-8 left-8 z-50 p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <GameContainer
                    title={gameTitle}
                    description={currentGame.description}
                    onGenerateQR={handlePublish}
                    customSettings={settingsComponent}
                    onTitleChange={setGameTitle}
                    onSave={handleSave}
                    isSaving={isSaving}
                >
                    {/* @ts-ignore dynamic components props */}
                    <GameComponent {...gameProps} />
                </GameContainer>


                <GameQRModal
                    isOpen={isQRModalOpen}
                    onClose={() => setIsQRModalOpen(false)}
                    gameTitle={gameTitle}
                    gameUrl={`${typeof window !== 'undefined' ? window.location.origin : 'https://happymeter.app'}/play/${selectedGame}?uid=${userId}`}
                />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            <div className="mb-8">
                <Link href="/dashboard/games" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
                    <ArrowLeft className="w-4 h-4" /> Volver al Centro de Juegos
                </Link>
                <h1 className="text-3xl font-bold text-white mb-2">
                    Juegos para Bares y Antros <span className="text-2xl">😈</span>
                </h1>
                <p className="text-gray-400">
                    Selecciona una dinámica para activar en tu establecimiento esta noche.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GAMES.map((game) => (
                    <div
                        key={game.id}
                        onClick={() => handleSelectGame(game.id)}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111] p-8 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/10"
                    >
                        {/* Background Gradient */}
                        <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${game.color} opacity-10 blur-[50px] rounded-full group-hover:opacity-20 transition-opacity`} />

                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                            <game.icon className="w-7 h-7 text-white" />
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">{game.title}</h3>
                        <p className="text-gray-400 mb-6">{game.description}</p>

                        <div className="flex items-center text-sm font-bold text-violet-400 group-hover:text-violet-300">
                            Jugar Ahora <ArrowLeft className="w-4 h-4 rotate-180 ml-2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

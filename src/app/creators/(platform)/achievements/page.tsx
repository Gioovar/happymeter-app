'use client'

import React, { useState, useEffect } from 'react'
import { getMyAchievements } from '@/actions/creator-achievements'
import { submitAchievementEvidence } from '@/actions/submit-achievement'
import { Trophy, Star, Lock, CheckCircle2, Loader2, ArrowRight, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Custom Funky Badges Component
const LevelBadge = ({ level }: { level: number }) => {
    // Level 1-3: Melting Green (The "Happy Melt")
    if (level < 4) {
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(74,222,128,0.6)]">
                <path d="M50 5 C25 5 5 25 5 50 C5 65 15 75 15 85 C15 95 25 90 35 95 C45 100 55 90 65 95 C75 100 85 90 85 80 C85 70 95 60 95 50 C95 25 75 5 50 5 Z" fill="#4ade80" />
                {/* Comma Eyes */}
                <path d="M35 30 C30 30 30 40 35 45 C40 50 45 40 35 30 Z" fill="black" />
                <path d="M65 30 C60 30 60 40 65 45 C70 50 75 40 65 30 Z" fill="black" />
                {/* Wide Smile */}
                <path d="M25 60 Q50 85 75 60" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" />
            </svg>
        )
    }
    // Level 4-6: Dizzy Blue (The "Trippy Swirl")
    if (level < 7) {
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(96,165,250,0.6)]">
                {/* Warped Circle */}
                <path d="M50 5 C20 5 5 25 10 50 C15 75 5 90 25 95 C45 100 55 95 75 90 C95 85 90 65 95 50 C100 25 80 5 50 5 Z" fill="#60a5fa" />
                {/* Swirl Eyes */}
                <g transform="translate(35, 40)">
                    <path d="M0 0 Q5 -5 10 0 T20 0" fill="none" stroke="black" strokeWidth="3" />
                    <path d="M10 5 Q5 10 0 5 T-10 5" fill="none" stroke="black" strokeWidth="3" />
                </g>
                <g transform="translate(65, 40)">
                    <path d="M0 0 Q5 -5 10 0 T20 0" fill="none" stroke="black" strokeWidth="3" />
                    <path d="M10 5 Q5 10 0 5 T-10 5" fill="none" stroke="black" strokeWidth="3" />
                </g>
                {/* Wobbly Smile */}
                <path d="M30 70 Q40 80 50 75 Q60 70 70 75" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" />
            </svg>
        )
    }
    // Level 7-10: Starstruck Pink (The "Hyped Star")
    if (level < 11) {
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(232,121,249,0.6)]">
                {/* Spiky Circle */}
                <path d="M50 5 L60 25 L85 25 L70 45 L80 70 L55 60 L35 80 L35 55 L10 45 L35 30 L35 5 Z" fill="#e879f9" stroke="#c026d3" strokeWidth="2" style={{ borderRadius: '50%' }} />
                {/* Star Eyes */}
                <path d="M35 30 L38 38 L46 38 L40 44 L42 52 L35 46 L28 52 L30 44 L24 38 L32 38 Z" fill="black" />
                <path d="M65 30 L68 38 L76 38 L70 44 L72 52 L65 46 L58 52 L60 44 L54 38 L62 38 Z" fill="black" />
                {/* Open Mouth */}
                <path d="M35 65 Q50 85 65 65 Z" fill="black" />
            </svg>
        )
    }
    // Level 11+: Rich Gold (The "Dripping Gold")
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]">
            {/* Dripping Gold Shape */}
            <path d="M50 2 C25 2 5 22 5 47 C5 60 12 65 12 75 C12 85 20 95 30 90 C40 85 45 75 50 80 C55 85 60 95 70 90 C80 85 88 75 88 60 C88 50 95 40 95 25 C95 10 75 2 50 2 Z" fill="#facc15" />
            {/* Dollar Eyes */}
            <text x="25" y="55" fontSize="30" fontWeight="900" fill="black">$</text>
            <text x="65" y="55" fontSize="30" fontWeight="900" fill="black">$</text>
            {/* Smirk */}
            <path d="M35 75 Q50 85 65 70" fill="none" stroke="black" strokeWidth="5" strokeLinecap="round" />
        </svg>
    )
}

export default function CreatorAchievementsPage() {
    const [achievements, setAchievements] = useState<any[]>([])
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedAchievement, setSelectedAchievement] = useState<any>(null)
    const [evidenceUrl, setEvidenceUrl] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showRules, setShowRules] = useState(false)

    const load = async () => {
        try {
            const data = await getMyAchievements()
            setAchievements(data.achievements)
            setProfile(data.profile)
        } catch (error) {
            toast.error('Error cargando logros')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const handleSubmitEvidence = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!evidenceUrl) return

        setSubmitting(true)
        try {
            const res = await submitAchievementEvidence(selectedAchievement.id, evidenceUrl)
            if (res.success) {
                toast.success('Evidencia enviada para revisión')
                setSelectedAchievement(null)
                setEvidenceUrl('')
                load() // Reload to see status update
            }
        } catch (error) {
            toast.error('Error enviando evidencia')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        )
    }

    // Stats
    const totalUnlocked = achievements.filter(a => a.unlocked).length
    const totalEarned = achievements.filter(a => a.unlocked).reduce((acc, curr) => acc + curr.rewardAmount, 0)
    const currLevel = profile?.level || 1

    return (
        <div className="p-4 md:p-8 space-y-8 text-white min-h-screen pb-20">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-[#1A1A1A] to-black border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 md:gap-8 relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />

                {/* Custom Funky Badge */}
                <div className="relative shrink-0 transition-transform hover:scale-110 duration-500 cursor-help">
                    <div className="w-32 h-32">
                        <LevelBadge level={currLevel} />
                    </div>
                    <div className="absolute -bottom-2 inset-x-0 mx-auto w-max px-3 py-1 bg-black/80 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white text-center shadow-xl">
                        Nivel {currLevel}
                    </div>
                </div>

                {/* Info / Rules Button */}
                {/* Info / Rules Button */}
                <button
                    onClick={() => setShowRules(true)}
                    className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-xs md:text-sm font-bold text-white transition-all hover:scale-105 z-20 shadow-lg group"
                >
                    <Info className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
                    <span>Condiciones de Entrega</span>
                </button>

                {/* Info & Progress */}
                <div className="flex-1 w-full text-center md:text-left z-10">
                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            {profile?.firstName} {profile?.lastName}
                        </h1>
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-yellow-400 font-bold text-sm">{profile?.rating ? Number(profile.rating).toFixed(1) : '5.0'}</span>
                        </div>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 max-w-xl mx-auto md:mx-0">
                        {currLevel < 5 ? 'Estás comenzando tu viaje. ¡Completa misiones para destacar!' :
                            currLevel < 10 ? '¡Estás creciendo rápido! Las marcas te están notando.' :
                                currLevel < 15 ? 'Eres un referente. Tu influencia vale mucho.' :
                                    '¡Leyenda absoluta! El cielo es el límite.'}
                    </p>

                    {/* Overall Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <span>Progreso General</span>
                            <span>{totalUnlocked} / {achievements.length} Logros</span>
                        </div>
                        <div className="h-4 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all duration-1000 relative"
                                style={{ width: `${(totalUnlocked / achievements.length) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Reward Stats */}
                <div className="hidden md:block text-right shrink-0 z-10">
                    <p className="text-sm text-gray-400 uppercase font-bold mb-1">Recompensas</p>
                    <p className="text-4xl font-bold text-green-400 drop-shadow-sm">${totalEarned} MXN</p>
                </div>
            </div>

            <h2 className="text-2xl font-bold">Tu Camino al Éxito</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {achievements.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => setSelectedAchievement(item)}
                        className={`relative p-6 rounded-2xl border transition-all duration-300 group overflow-hidden cursor-pointer ${item.unlocked
                            ? 'bg-gradient-to-br from-violet-900/20 to-black border-violet-500/50 shadow-lg shadow-violet-900/20'
                            : 'bg-black/40 border-white/5 opacity-80 hover:opacity-100 hover:border-white/10'
                            }`}
                    >
                        {/* Background Decoration */}
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl ${item.unlocked ? 'bg-violet-600/20' : 'bg-white/5'
                            }`} />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-4xl drop-shadow-lg filter">{item.icon}</span>
                                {item.unlocked ? (
                                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                                ) : (
                                    <Lock className="w-5 h-5 text-gray-600" />
                                )}
                            </div>

                            <h3 className={`font-bold text-lg mb-1 ${item.unlocked ? 'text-white' : 'text-gray-400'}`}>
                                {item.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-4 h-10 line-clamp-2">{item.description}</p>

                            <div className="mt-auto space-y-3">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className={item.unlocked ? 'text-violet-300' : 'text-gray-600'}>Progreso</span>
                                    <span className={item.unlocked ? 'text-white' : 'text-gray-500'}>{Math.round(item.progress)}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${item.unlocked ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-gray-700'
                                            }`}
                                        style={{ width: `${item.progress}%` }}
                                    />
                                </div>

                                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 font-mono">Nivel {item.level}</span>
                                    {item.rewardAmount > 0 && (
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.unlocked ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-500'
                                            }`}>
                                            +${item.rewardAmount} MXN
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Achievement Detail Modal */}
            <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
                <DialogContent className="bg-[#111] border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl">
                            <span className="text-4xl shadow-inner">{selectedAchievement?.icon}</span>
                            <div>
                                <h3 className="font-bold">{selectedAchievement?.name}</h3>
                                <p className="text-sm font-normal text-gray-400 mt-1">Nivel {selectedAchievement?.level}</p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h4 className="text-sm font-bold text-violet-400 mb-2">Descripción</h4>
                            <p className="text-gray-300 text-sm leading-relaxed">{selectedAchievement?.description}</p>
                        </div>

                        {selectedAchievement?.instructions && (
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <h4 className="text-sm font-bold text-yellow-400 mb-2">Cómo lograrlo (Instrucciones)</h4>
                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedAchievement?.instructions}</p>
                            </div>
                        )}

                        {!selectedAchievement?.unlocked && (
                            <div>
                                <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                                    <ArrowRight className="w-4 h-4" /> Enviar Evidencia
                                </h4>
                                <form onSubmit={handleSubmitEvidence} className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500">URL del contenido (Reel, TikTok, Post)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="url"
                                                required
                                                placeholder="https://instagram.com/p/..."
                                                value={evidenceUrl}
                                                onChange={(e) => setEvidenceUrl(e.target.value)}
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 transition outline-none"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar para Revisión'}
                                    </button>
                                    <p className="text-xs text-gray-500 text-center">
                                        El equipo revisará tu evidencia en menos de 24 horas.
                                    </p>
                                </form>
                            </div>
                        )}

                        {selectedAchievement?.unlocked && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                                <div>
                                    <h4 className="font-bold text-green-400">¡Logro Completado!</h4>
                                    <p className="text-xs text-green-300/70">Ya has recibido tu recompensa por este nivel.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>


            {/* Rules / Conditions Modal */}
            <Dialog open={showRules} onOpenChange={setShowRules}>
                <DialogContent className="bg-[#111] border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-yellow-400">
                            <Info className="w-5 h-5" />
                            Condiciones de Entrega
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4 text-sm text-gray-300 leading-relaxed">
                        <p>
                            <strong className="text-white block mb-1">1. Envío de Evidencia</strong>
                            Debes enviar el enlace (URL) o prueba de tu logro. Nuestro staff revisará que cumpla con los requisitos.
                        </p>
                        <p>
                            <strong className="text-white block mb-1">2. Aprobación y Pago</strong>
                            Después de ser aprobada, podrás retirar tu dinero.
                        </p>
                        <p>
                            <strong className="text-white block mb-1">3. Tiempos de Retiro</strong>
                            Tus fondos se desbloquearán en el transcurso de <span className="text-yellow-400 font-bold">24 días hábiles</span>.
                        </p>
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-xs text-green-300">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            Verás en verde los fondos que ya están listos para retirar.
                        </div>
                    </div>
                    <button
                        onClick={() => setShowRules(false)}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition"
                    >
                        Entendido
                    </button>
                </DialogContent>
            </Dialog>
        </div >
    )
}

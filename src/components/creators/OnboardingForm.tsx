'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
    Instagram, Youtube, Save, Loader2, Target, Users, LayoutTemplate,
    ArrowRight, Sparkles, Music2, Facebook, Link as LinkIcon, MessageCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { submitCreatorOnboarding } from '@/actions/creator-onboarding'

const NICHES = [
    'Belleza y Moda', 'Tecnología', 'Comida y Restaurantes',
    'Viajes', 'Lifestyle', 'Fitness', 'Entretenimiento', 'Negocios', 'Otro'
]

const AUDIENCE_SIZES = [
    '< 1k', '1k - 10k', '10k - 50k', '50k - 100k', '100k+'
]

export default function CreatorOnboardingForm() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [form, setForm] = useState({
        instagram: '',
        tiktok: '',
        youtube: '',
        facebook: '',
        otherSocials: '',
        whatsapp: '',
        niche: '',
        audienceSize: '',
        contentStrategy: ''
    })

    const handleChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const isValid = () => {
        // Require at least one social + niche + audience + strategy + whatsapp
        const hasSocial = form.instagram || form.tiktok || form.youtube || form.facebook || form.otherSocials
        return hasSocial && form.niche && form.audienceSize && form.contentStrategy.length > 20 && form.whatsapp.length > 8
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid()) return

        startTransition(async () => {
            try {
                await submitCreatorOnboarding(form)
                toast.success('¡Perfil actualizado con éxito!', { duration: 4000 })
                // Wait a bit for toast and revalidation
                setTimeout(() => {
                    router.push('/creators/dashboard')
                }, 1000)
            } catch (error) {
                console.error(error)
                const message = error instanceof Error ? error.message : 'Error al guardar.'
                toast.error(message)
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">

            {/* Socials Section */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-pink-500/20 rounded-lg text-pink-500">
                        <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Tus Redes Sociales</h3>
                        <p className="text-sm text-gray-400">¿Dónde se encuentran tus seguidores? (Mínimo una)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-full">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp (Para notificarte) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    placeholder="+52 55..."
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                                    value={form.whatsapp}
                                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Instagram className="w-4 h-4 text-pink-500" /> Instagram Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                            <input
                                type="text"
                                placeholder="usuario"
                                value={form.instagram}
                                onChange={e => handleChange('instagram', e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Music2 className="w-4 h-4 text-cyan-400" /> TikTok Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                            <input
                                type="text"
                                placeholder="usuario"
                                value={form.tiktok}
                                onChange={e => handleChange('tiktok', e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Youtube className="w-4 h-4 text-red-500" /> YouTube Channel
                        </label>
                        <input
                            type="text"
                            placeholder="Enlace a tu canal"
                            value={form.youtube}
                            onChange={e => handleChange('youtube', e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Facebook className="w-4 h-4 text-blue-500" /> Facebook Profile
                        </label>
                        <input
                            type="text"
                            placeholder="Enlace a tu perfil"
                            value={form.facebook}
                            onChange={e => handleChange('facebook', e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                        />
                    </div>

                    <div className="space-y-2 col-span-full">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-gray-400" /> Otras Redes (LinkedIn, Web, etc)
                        </label>
                        <input
                            type="text"
                            placeholder="Enlaces adicionales..."
                            value={form.otherSocials}
                            onChange={e => handleChange('otherSocials', e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
                        />
                    </div>
                </div>
            </div>

            {/* Audience & Niche */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Tu Audiencia</h3>
                        <p className="text-sm text-gray-400">Ayúdanos a conectarte con las mejores marcas.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Target className="w-4 h-4 text-violet-400" /> Nicho Principal
                        </label>
                        <select
                            value={form.niche}
                            onChange={(e) => handleChange('niche', e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition appearance-none"
                        >
                            <option value="">Selecciona un nicho</option>
                            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Tamaño de Audiencia (Total)</label>
                        <select
                            value={form.audienceSize}
                            onChange={(e) => handleChange('audienceSize', e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition appearance-none"
                        >
                            <option value="">Selecciona un rango</option>
                            {AUDIENCE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" /> Estrategia de Contenido
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                        Describe brevemente cómo promocionarías los lugares (ej. "Hago vlogs diarios de comida", "Historias interactivas", etc.)
                    </p>
                    <textarea
                        value={form.contentStrategy}
                        onChange={e => handleChange('contentStrategy', e.target.value)}
                        placeholder="Mi audiencia ama cuando visito lugares nuevos y..."
                        className="w-full h-24 bg-[#0a0a0a] border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition resize-none"
                    />
                    <p className="text-right text-xs text-gray-500">
                        {form.contentStrategy.length}/20 min
                    </p>
                </div>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={!isValid() || isPending}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-violet-900/20 transition-all flex items-center justify-center gap-2 group"
            >
                {isPending ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Guardando...
                    </>
                ) : (
                    <>
                        Completar Perfil <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                    </>
                )}
            </button>

        </form>
    )
}

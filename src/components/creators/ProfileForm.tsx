'use client'

import { useState, useTransition } from 'react'
import { AffiliateProfile } from '@prisma/client'
import { toast } from 'sonner'
import { updateCreatorProfile } from '@/actions/creators'
import { Loader2, Save } from 'lucide-react'

export default function ProfileForm({ profile }: { profile: AffiliateProfile }) {
    const [isPending, startTransition] = useTransition()

    // Form State
    const [paypalEmail, setPaypalEmail] = useState(profile.paypalEmail || '')
    const [instagram, setInstagram] = useState(profile.instagram || '')
    const [tiktok, setTiktok] = useState(profile.tiktok || '')
    const [youtube, setYoutube] = useState(profile.youtube || '')
    const [twitch, setTwitch] = useState(profile.twitch || '')
    const [facebook, setFacebook] = useState(profile.facebook || '')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            try {
                await updateCreatorProfile({
                    paypalEmail,
                    instagram,
                    tiktok,
                    youtube,
                    twitch,
                    facebook
                })
                toast.success('Perfil actualizado correctamente')
            } catch (error) {
                toast.error('Error al actualizar perfil')
                console.error(error)
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    PayPal Email (para pagos)
                </label>
                <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                    placeholder="email@paypal.com"
                />
            </div>

            <div className="pt-4 border-t border-white/5">
                <p className="text-sm font-bold text-gray-300 mb-4">Redes Sociales</p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Instagram</label>
                        <input
                            type="text"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                            placeholder="@usuario"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">TikTok</label>
                        <input
                            type="text"
                            value={tiktok}
                            onChange={(e) => setTiktok(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                            placeholder="@usuario"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">YouTube</label>
                        <input
                            type="text"
                            value={youtube}
                            onChange={(e) => setYoutube(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                            placeholder="Canal URL"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Twitch</label>
                        <input
                            type="text"
                            value={twitch}
                            onChange={(e) => setTwitch(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                            placeholder="Canal URL"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">Facebook</label>
                        <input
                            type="text"
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition"
                            placeholder="Perfil o Página"
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full mt-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
            </button>
        </form >
    )
}

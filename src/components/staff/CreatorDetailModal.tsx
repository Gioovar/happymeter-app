'use client'

import { AffiliateProfile } from '@prisma/client'
import { X, Phone, Mail, MessageCircle, Instagram, Facebook, Youtube, Globe, Link as LinkIcon, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface CreatorDetailModalProps {
    creator: AffiliateProfile
    onClose: () => void
}

export default function CreatorDetailModal({ creator, onClose }: CreatorDetailModalProps) {

    // Clean WhatsApp number for link
    const waNumber = creator.whatsapp?.replace(/[^0-9]/g, '') || ''

    // Helper to render social row
    const SocialRow = ({ icon: Icon, label, value, href }: { icon: any, label: string, value?: string | null, href?: string }) => {
        if (!value) return null
        return (
            <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3 text-gray-400">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 group">
                        {value} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    </a>
                ) : (
                    <span className="text-white text-sm">{value}</span>
                )}
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#111]">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            {creator.code}
                            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded uppercase">
                                {creator.status}
                            </span>
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">ID: {creator.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Qualification Data */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Perfil de Creador</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-xl space-y-1">
                                <span className="text-xs text-gray-500 block">Nicho</span>
                                <span className="font-medium text-white">{creator.niche || 'No especificado'}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl space-y-1">
                                <span className="text-xs text-gray-500 block">Tamaño Audiencia</span>
                                <span className="font-medium text-white">{creator.audienceSize || 'No especificado'}</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-xl space-y-1 md:col-span-2">
                                <span className="text-xs text-gray-500 block">Estrategia de Contenido</span>
                                <p className="text-white text-sm leading-relaxed mt-1">
                                    "{creator.contentStrategy || 'Sin estrategia detallada.'}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Socials & Contact */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Redes y Contacto</h3>
                        <div className="bg-white/5 rounded-xl p-4 space-y-1">
                            <SocialRow icon={Mail} label="Email (PayPal)" value={creator.paypalEmail} href={`mailto:${creator.paypalEmail}`} />
                            <SocialRow icon={Phone} label="WhatsApp" value={creator.whatsapp} href={waNumber ? `https://wa.me/${waNumber}` : undefined} />
                            <SocialRow icon={Instagram} label="Instagram" value={creator.instagram} href={creator.instagram ? `https://instagram.com/${creator.instagram.replace('@', '')}` : undefined} />
                            <SocialRow icon={Facebook} label="Facebook" value={creator.facebook} href={creator.facebook || undefined} />
                            <SocialRow icon={Globe} label="TikTok" value={creator.tiktok} href={creator.tiktok ? `https://tiktok.com/@${creator.tiktok.replace('@', '')}` : undefined} />
                            <SocialRow icon={Youtube} label="YouTube" value={creator.youtube} href={creator.youtube || undefined} />
                            <SocialRow icon={LinkIcon} label="Otros" value={creator.otherSocials} href={creator.otherSocials || undefined} />
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-[#111] grid grid-cols-3 gap-3">
                    <a
                        href={`tel:${creator.whatsapp}`}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition hover:scale-[1.02] active:scale-95"
                    >
                        <Phone className="w-4 h-4" />
                        <span className="hidden md:inline">Llamar</span>
                    </a>

                    <a
                        href={waNumber ? `https://wa.me/${waNumber}` : '#'}
                        target="_blank"
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition hover:scale-[1.02] active:scale-95 shadow-lg shadow-green-900/20"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="hidden md:inline">WhatsApp</span>
                    </a>

                    <a
                        href={`mailto:${creator.paypalEmail}`}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-900/20"
                    >
                        <Mail className="w-4 h-4" />
                        <span className="hidden md:inline">Email</span>
                    </a>
                </div>

            </div>
        </div>
    )
}

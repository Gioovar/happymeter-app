'use client'

import { useState } from 'react'
import { X, ArrowRight, MessageSquare, Phone, Mail, Star } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ResponseDetailModalProps {
    isOpen: boolean
    onClose: () => void
    response: any
    onBack?: () => void
}

export default function ResponseDetailModal({ isOpen, onClose, response, onBack }: ResponseDetailModalProps) {
    if (!isOpen || !response) return null

    const rating = findRating(response.answers)
    const comment = findComment(response.answers)

    // Use the standardized properties from API, fallback to DB columns
    const phone = response.phone || response.customerPhone
    const email = response.email || response.customerEmail
    const name = response.user || response.customerName || 'Cliente Anónimo'

    const [showImage, setShowImage] = useState(false)
    const photoUrl = response.photo

    // Clean phone for WhatsApp link (remove non-digits)
    const waLink = phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : '#'

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Lightbox for Image - Kept as is for functionality */}
            {showImage && photoUrl && (
                <div
                    className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowImage(false)
                    }}
                >
                    <button
                        onClick={() => setShowImage(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={photoUrl}
                        alt="Evidencia del cliente"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    />
                </div>
            )}

            <div
                className="bg-[#0a0a0a] border border-white/10 rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10"
                    >
                        Volver <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition text-gray-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 pt-12 overflow-y-auto custom-scrollbar flex-1 space-y-8">

                    {/* User Profile - Centered & Prominent */}
                    <div className="flex flex-col items-center text-center relative">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-2xl ring-4 ring-black ${['bg-violet-500', 'bg-fuchsia-500', 'bg-blue-500'][name.length % 3]
                            }`}>
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{name}</h3>
                        <p className="text-gray-500 text-sm font-medium mb-3">
                            {format(new Date(response.createdAt), "d 'de' MMMM 'de' yyyy HH:mm", { locale: es })}
                        </p>
                        <div className="flex justify-center scale-110">{rating}</div>
                    </div>

                    {/* Quote Box - Dark & Sleek */}
                    <div className="bg-[#111] rounded-2xl p-6 text-center border border-white/5 shadow-inner relative group">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                        <p className="text-lg text-gray-200 italic font-medium leading-relaxed">"{comment || 'Sin comentarios'}"</p>
                    </div>

                    {/* Photo Evidence Section */}
                    {photoUrl && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">FOTO DE EXPERIENCIA</h4>
                            <div
                                className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-white/10 bg-[#111] hover:border-violet-500/30 transition-all w-full h-48"
                                onClick={() => setShowImage(true)}
                            >
                                <img
                                    src={photoUrl}
                                    alt="Evidencia"
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black/60 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Survey Details (Collapsed/Simplified) */}
                    <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">RESUMEN DE ENCUESTA</h4>
                        </div>
                        <div className="p-5 space-y-3">
                            {response.answers?.filter((a: any) =>
                                a.question?.type !== 'TEXT' &&
                                a.question?.type !== 'RATING' &&
                                a.question?.type !== 'EMOJI' &&
                                a.question?.type !== 'IMAGE'
                            ).map((ans: any, i: number) => (
                                <div key={i} className="flex justify-between items-start gap-4 text-sm group/item">
                                    <span className="text-gray-500 group-hover/item:text-gray-400 transition-colors flex-1">{ans.question?.text || 'Pregunta'}:</span>
                                    <span className="text-white font-medium text-right">{ans.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar - Large Icons */}
                <div className="p-6 pt-2 shrink-0 grid grid-cols-3 gap-4">
                    {/* WhatsApp */}
                    <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group relative flex items-center justify-center h-16 rounded-2xl border transition-all duration-300 overflow-hidden ${phone
                            ? 'bg-[#1a3826] border-[#25D366]/20 hover:border-[#25D366]/50 hover:shadow-[0_0_20px_rgba(37,211,102,0.15)]'
                            : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className={`absolute inset-0 bg-[#25D366]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${!phone && 'hidden'}`} />
                        <MessageSquare className={`w-7 h-7 relative z-10 ${phone ? 'text-[#25D366] group-hover:scale-110 transition-transform' : 'text-gray-600'}`} />
                    </a>

                    {/* Call */}
                    <a
                        href={phone ? `tel:${phone}` : '#'}
                        className={`group relative flex items-center justify-center h-16 rounded-2xl border transition-all duration-300 overflow-hidden ${phone
                            ? 'bg-[#1a2b4b] border-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                            : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className={`absolute inset-0 bg-blue-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${!phone && 'hidden'}`} />
                        <Phone className={`w-7 h-7 relative z-10 ${phone ? 'text-blue-400 group-hover:scale-110 transition-transform' : 'text-gray-600'}`} />
                    </a>

                    {/* Mail */}
                    <a
                        href={email ? `mailto:${email}` : '#'}
                        className={`group relative flex items-center justify-center h-16 rounded-2xl border transition-all duration-300 overflow-hidden ${email
                            ? 'bg-[#2a1a38] border-violet-500/20 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                            : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className={`absolute inset-0 bg-violet-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ${!email && 'hidden'}`} />
                        <Mail className={`w-7 h-7 relative z-10 ${email ? 'text-violet-400 group-hover:scale-110 transition-transform' : 'text-gray-600'}`} />
                    </a>
                </div>
            </div>
        </div>
    )
}

// Helpers
function findRating(answers: any[]) {
    if (!answers) return null
    const ratingAnswer = answers.find((a: any) => a.question?.type === 'RATING' || a.question?.type === 'EMOJI')
    if (ratingAnswer) {
        const val = parseInt(ratingAnswer.value)
        if (!isNaN(val)) {
            return (
                <div className="flex text-yellow-500">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < val ? 'fill-current' : 'text-gray-700'}`} />
                    ))}
                </div>
            )
        }
    }
    return null
}

function findComment(answers: any[]) {
    if (!answers) return null
    const textAnswer = answers.find((a: any) => a.question?.type === 'TEXT')
    return textAnswer ? textAnswer.value : null
}

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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Lightbox for Image */}
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
                className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between shrink-0">
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <button onClick={onClose} className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">
                        Volver <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 pt-0 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                    {/* User Profile */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ${['bg-violet-500', 'bg-fuchsia-500', 'bg-blue-500'][name.length % 3]
                            }`}>
                            {name.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
                        <p className="text-gray-500 text-sm mb-2">
                            {format(new Date(response.createdAt), "d 'de' MMMM 'de' yyyy HH:mm", { locale: es })}
                        </p>
                        <div className="flex justify-center">{rating}</div>
                    </div>

                    {/* Quote Box */}
                    <div className="bg-[#1a1a1a] rounded-xl p-6 text-center border border-white/5">
                        <p className="text-lg text-gray-300 italic">"{comment || 'Sin comentarios'}"</p>
                    </div>

                    {/* Photo Evidence */}
                    {photoUrl && (
                        <div className="flex flex-col items-center">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 self-start px-2">FOTO DE EXPERIENCIA</h4>
                            <div
                                className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] w-full h-48"
                                onClick={() => setShowImage(true)}
                            >
                                <img
                                    src={photoUrl}
                                    alt="Evidencia"
                                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200">
                                    <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full border border-white/20">
                                        Ver imagen completa
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Survey Summary */}
                    <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">RESUMEN DE ENCUESTA</h4>
                        </div>
                        <div className="p-5 space-y-4">
                            {response.answers?.filter((a: any) =>
                                a.question?.type !== 'TEXT' &&
                                a.question?.type !== 'RATING' &&
                                a.question?.type !== 'EMOJI' &&
                                a.question?.type !== 'IMAGE'
                            ).map((ans: any, i: number) => (
                                <div key={i} className="flex justify-between items-start gap-4 text-sm">
                                    <span className="text-gray-400 font-medium flex-1">{ans.question?.text || 'Pregunta'}:</span>
                                    <span className="text-white font-semibold text-right">{ans.value}</span>
                                </div>
                            ))}
                            {response.answers?.filter((a: any) => a.question?.type === 'TEXT').map((ans: any, i: number) => (
                                <div key={`text-${i}`} className="flex justify-between items-start gap-4 text-sm pt-2 border-t border-white/5">
                                    <span className="text-gray-400 font-medium flex-1">{ans.question?.text || 'Comentario'}:</span>
                                    <span className="text-white font-semibold text-right max-w-[50%]">{ans.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 pt-2 shrink-0 grid grid-cols-3 gap-3">
                    {/* WhatsApp */}
                    <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${phone
                            ? 'bg-[#1a3826] border-[#25D366]/20 text-[#25D366] hover:bg-[#1a3826]/80'
                            : 'bg-white/5 border-white/5 text-gray-600 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <MessageSquare className="w-6 h-6 mb-2" />
                    </a>

                    {/* Call */}
                    <a
                        href={phone ? `tel:${phone}` : '#'}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${phone
                            ? 'bg-[#1a2b4b] border-blue-500/20 text-blue-400 hover:bg-[#1a2b4b]/80'
                            : 'bg-white/5 border-white/5 text-gray-600 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <Phone className="w-6 h-6 mb-2" />
                    </a>

                    {/* Mail */}
                    <a
                        href={email ? `mailto:${email}` : '#'}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${email
                            ? 'bg-[#2a1a38] border-violet-500/20 text-violet-400 hover:bg-[#2a1a38]/80'
                            : 'bg-white/5 border-white/5 text-gray-600 opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <Mail className="w-6 h-6 mb-2" />
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

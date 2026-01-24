'use client'

import { useState, useEffect } from 'react'
import { X, Star, Calendar, MessageSquare, ArrowRight, Filter, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import ResponseDetailModal from './ResponseDetailModal'

interface ResponsesModalProps {
    isOpen: boolean
    onClose: () => void
    surveyId: string | null
    surveyTitle: string
    initialResponse?: any
}

export default function ResponsesModal({ isOpen, onClose, surveyId, surveyTitle, initialResponse }: ResponsesModalProps) {
    const [responses, setResponses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedResponse, setSelectedResponse] = useState<any | null>(null)

    useEffect(() => {
        if (isOpen && surveyId) {
            setLoading(true)
            setSelectedResponse(initialResponse || null) // Use initial if provided
            fetch(`/api/surveys/${surveyId}/responses?limit=30`)
                .then(res => res.json())
                .then(data => {
                    setResponses(data)
                    setLoading(false)
                })
                .catch(err => {
                    console.error(err)
                    setLoading(false)
                })
        }
    }, [isOpen, surveyId])

    if (!isOpen) return null

    // Detail View
    if (selectedResponse) {
        return (
            <ResponseDetailModal
                isOpen={!!selectedResponse}
                onClose={onClose}
                response={selectedResponse}
                onBack={() => setSelectedResponse(null)}
                surveyTitle={surveyTitle}
            />
        )
    }

    // List View
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-violet-500" />
                            Últimas Respuestas
                        </h3>
                        <p className="text-gray-400 text-sm mt-1">Encuesta: <span className="text-white">{surveyTitle}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                            <p className="text-gray-500 text-sm">Cargando respuestas...</p>
                        </div>
                    ) : responses.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No hay respuestas recientes.</p>
                        </div>
                    ) : (
                        responses.map((response) => (
                            <div
                                key={response.id}
                                onClick={() => setSelectedResponse(response)}
                                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/50 hover:bg-white/10 transition cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {findRating(response.answers) || <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">N/A</span>}
                                        <span className="text-sm text-gray-400">•</span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(response.createdAt), "d MMM, HH:mm", { locale: es })}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1 group-hover:text-violet-400 transition">
                                        {/* Optional: Show customer info if available */}
                                        {response.customerName || 'Cliente'}
                                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <div className="text-sm text-gray-300 line-clamp-2">
                                    {findComment(response.answers) || <span className="italic text-gray-600">Sin comentarios escritos</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-white/5 rounded-b-2xl">
                    <Link
                        href={`/dashboard/surveys/${surveyId}/responses`}
                        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/20 text-white font-bold transition flex items-center justify-center gap-2 text-sm"
                    >
                        Ver Todas con Filtros Avanzados <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

// Helpers to extract data from answers
function findRating(answers: any[]) {
    // Look for RATING type questions or numeric values
    // This is a heuristic. Ideally question type would be passed or we'd know.
    const ratingAnswer = answers.find((a: any) => a.question.type === 'RATING' || a.question.type === 'EMOJI')
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
    // Look for TEXT type questions
    const textAnswer = answers.find((a: any) => a.question.type === 'TEXT')
    return textAnswer ? textAnswer.value : null
}

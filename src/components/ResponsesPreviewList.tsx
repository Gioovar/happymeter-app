'use client'

import { Star, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Response {
    id: string
    createdAt: string
    answers: {
        value: string
        question: {
            type: string
        }
    }[]
}

interface ResponsesPreviewListProps {
    responses: Response[]
    onViewMore: () => void
    onSelectResponse: (response: Response) => void
}

export default function ResponsesPreviewList({ responses, onViewMore, onSelectResponse }: ResponsesPreviewListProps) {
    if (!responses || responses.length === 0) return null

    return (
        <div className="mb-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Último Feedback</h4>
            <div className="space-y-3 mb-3">
                {responses.slice(0, 3).map((r) => {
                    // Heuristics to find rating (numeric/emoji) and text comment
                    const ratingAnswer = r.answers.find(a => a.question.type === 'RATING' || a.question.type === 'EMOJI')
                    const commentAnswer = r.answers.find(a => a.question.type === 'TEXT')

                    let ratingVal = 0
                    if (ratingAnswer) ratingVal = parseInt(ratingAnswer.value) || 0

                    return (
                        <div
                            key={r.id}
                            onClick={(e) => {
                                e.stopPropagation()
                                onSelectResponse(r)
                            }}
                            className="text-sm p-2 rounded-lg -mx-2 hover:bg-white/5 cursor-pointer transition group"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-3 h-3 ${i < ratingVal ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] text-gray-500">
                                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: es })}
                                </span>
                            </div>
                            <p className="text-gray-300 line-clamp-1 text-xs group-hover:text-white transition">
                                {commentAnswer?.value || <span className="text-gray-600 italic">Sin comentario</span>}
                            </p>
                        </div>
                    )
                })}
            </div>
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onViewMore()
                }}
                className="text-xs text-violet-400 hover:text-white transition flex items-center gap-1 font-medium"
            >
                <MessageSquare className="w-3 h-3" /> Ver más respuestas
            </button>
        </div>
    )
}

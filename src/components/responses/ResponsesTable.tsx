'use client'

import { Star, MoreHorizontal, MessageSquare, Phone, Mail } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Response {
    id: string
    createdAt: Date
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
    survey: {
        title: string
    }
    answers: {
        value: string
        question: {
            type: string
        }
    }[]
}

export default function ResponsesTable({ responses, onViewResponse }: { responses: any[], onViewResponse: (r: any) => void }) {
    if (!responses || responses.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500 bg-[#111] rounded-2xl border border-white/5">
                No hay respuestas aún.
            </div>
        )
    }

    return (
        <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-[#111]">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-white/5 text-gray-500">
                        <th className="px-6 py-4 font-medium">User</th>
                        <th className="px-6 py-4 font-medium">Feedback</th>
                        <th className="px-6 py-4 font-medium">Rating</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {responses.map((r) => {
                        // Extract Rating and Main Comment
                        const ratingAnswer = r.answers.find((a: any) => a.question.type === 'RATING' || a.question.type === 'EMOJI')
                        const commentAnswer = r.answers.find((a: any) => a.question.type === 'TEXT')

                        let ratingVal = 0
                        if (ratingAnswer) ratingVal = parseInt(ratingAnswer.value) || 0

                        const displayName = r.customerName || 'Anónimo'
                        const initial = displayName.charAt(0).toUpperCase()

                        // Random avatar color based on name length
                        const avatarColors = ['bg-violet-500', 'bg-fuchsia-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500']
                        const avatarBg = avatarColors[displayName.length % avatarColors.length]

                        return (
                            <tr
                                key={r.id}
                                onClick={() => onViewResponse(r)}
                                className="group hover:bg-white/[0.02] transition cursor-pointer"
                            >
                                {/* User Column */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center font-bold text-white`}>
                                            {initial}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{displayName}</div>
                                            <div className="text-xs text-gray-500">{r.survey.title}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Feedback Column */}
                                <td className="px-6 py-4 max-w-xs">
                                    <div className="flex flex-col gap-2">
                                        <p className="line-clamp-2 text-gray-300">
                                            {commentAnswer?.value || <span className="italic text-gray-600">Sin comentario escrito</span>}
                                        </p>

                                        {/* Image Thumbnail */}
                                        {r.photo && (
                                            <div className="mt-1">
                                                <div className="relative h-12 w-20 rounded-lg overflow-hidden border border-white/10 group/img">
                                                    <img
                                                        src={r.photo}
                                                        alt="Evidencia"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <span className="text-xs text-gray-600">
                                            {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>
                                </td>

                                {/* Rating Column */}
                                <td className="px-6 py-4">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < ratingVal ? 'text-yellow-500 fill-yellow-500' : 'text-gray-800'}`}
                                            />
                                        ))}
                                    </div>
                                </td>

                                {/* Actions Column */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {r.customerPhone && (
                                            <a
                                                href={`https://wa.me/${r.customerPhone}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 rounded-lg hover:bg-white/10 text-green-400 opacity-0 group-hover:opacity-100 transition"
                                                title="WhatsApp"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </a>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onViewResponse(r)
                                            }}
                                            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

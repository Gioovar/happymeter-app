'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Filter, Star, Download, Search, Smile, Meh, Frown } from 'lucide-react'
import Link from 'next/link'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { DateRangePicker } from '@/components/DateRangePicker'
import { DateRange } from 'react-day-picker'
import ResponseDetailModal from '@/components/ResponseDetailModal'

type FilterType = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'

interface SurveyResponsesViewProps {
    surveyId: string
    backLink?: string
}

export default function SurveyResponsesView({ surveyId, backLink = '/dashboard' }: SurveyResponsesViewProps) {
    const router = useRouter()

    const [responses, setResponses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedResponse, setSelectedResponse] = useState<any | null>(null)
    const [filter, setFilter] = useState<FilterType>('ALL')
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date()
    })

    // Fetch Responses
    useEffect(() => {
        const fetchResponses = async () => {
            setLoading(true)
            try {
                // Construct query params
                const query = new URLSearchParams()
                if (dateRange?.from) query.set('from', dateRange.from.toISOString())
                if (dateRange?.to) query.set('to', dateRange.to.toISOString())
                if (filter !== 'ALL') query.set('sentiment', filter)

                const res = await fetch(`/api/surveys/${surveyId}/responses?${query.toString()}`)
                if (res.ok) {
                    const data = await res.json()
                    setResponses(data)
                }
            } catch (error) {
                console.error('Error fetching responses', error)
            } finally {
                setLoading(false)
            }
        }

        if (surveyId) {
            fetchResponses()
        }
    }, [surveyId, dateRange, filter])

    // Helper to find rating value
    const getRating = (answers: any[]) => {
        const ans = answers.find((a: any) => a.question.type === 'RATING' || a.question.type === 'EMOJI')
        return ans ? parseInt(ans.value) : 0
    }

    // Helper to find text
    const getComment = (answers: any[]) => {
        const ans = answers.find((a: any) => a.question.type === 'TEXT')
        return ans ? ans.value : ''
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30 font-sans -mx-4 md:-mx-8">
            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-8 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Link href={backLink} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
                        <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold">Análisis de Respuestas</h1>
                        <div className="flex items-center gap-3">
                            <DateRangePicker
                                date={dateRange}
                                setDate={setDateRange}
                            />
                            <button className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition flex items-center gap-2 text-sm font-medium">
                                <Download className="w-4 h-4" /> Exportar CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Smart Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`p-4 rounded-xl border transition text-left flex flex-col gap-2 ${filter === 'ALL' ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'}`}
                    >
                        <span className="text-gray-400 text-xs uppercase font-bold tracking-wider">Todas</span>
                        <div className="flex items-center gap-2 text-xl font-bold">
                            <Search className="w-5 h-5 text-gray-400" />
                            Ver Todo
                        </div>
                    </button>

                    <button
                        onClick={() => setFilter('HIGH')}
                        className={`p-4 rounded-xl border transition text-left flex flex-col gap-2 ${filter === 'HIGH' ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'}`}
                    >
                        <span className="text-green-400 text-xs uppercase font-bold tracking-wider">Excelentes (4-5)</span>
                        <div className="flex items-center gap-2 text-xl font-bold text-green-400">
                            <Smile className="w-6 h-6" />
                            Promotores
                        </div>
                    </button>

                    <button
                        onClick={() => setFilter('MEDIUM')}
                        className={`p-4 rounded-xl border transition text-left flex flex-col gap-2 ${filter === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'}`}
                    >
                        <span className="text-yellow-400 text-xs uppercase font-bold tracking-wider">Regulares (3)</span>
                        <div className="flex items-center gap-2 text-xl font-bold text-yellow-400">
                            <Meh className="w-6 h-6" />
                            Pasivos
                        </div>
                    </button>

                    <button
                        onClick={() => setFilter('LOW')}
                        className={`p-4 rounded-xl border transition text-left flex flex-col gap-2 ${filter === 'LOW' ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5 hover:bg-white/[0.07]'}`}
                    >
                        <span className="text-red-400 text-xs uppercase font-bold tracking-wider">Malas (1-2)</span>
                        <div className="flex items-center gap-2 text-xl font-bold text-red-400">
                            <Frown className="w-6 h-6" />
                            Detractores
                        </div>
                    </button>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : responses.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-gray-400">No se encontraron respuestas con estos filtros.</p>
                        </div>
                    ) : (
                        responses.map((r) => {
                            const rating = getRating(r.answers)
                            const comment = getComment(r.answers)

                            return (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedResponse(r)}
                                    className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition group cursor-pointer hover:bg-white/10 active:scale-[0.99] animate-in fade-in slide-in-from-bottom-2 duration-300"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-800'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-400">
                                                {format(new Date(r.createdAt), "PPP p", { locale: es })}
                                            </span>
                                        </div>
                                        {/* Tag based on score */}
                                        <div>
                                            {rating >= 4 && <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">Excelente</span>}
                                            {rating === 3 && <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">Regular</span>}
                                            {rating <= 2 && rating > 0 && <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">Atención</span>}
                                        </div>
                                    </div>

                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <p className="text-gray-200">
                                            {comment || <span className="text-gray-600 italic">El cliente no dejó comentarios adicionales.</span>}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                                        <span>ID: {r.id.slice(0, 8)}</span>
                                        {r.customerEmail && <span>• Email: {r.customerEmail}</span>}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            <ResponseDetailModal
                isOpen={!!selectedResponse}
                onClose={() => setSelectedResponse(null)}
                response={selectedResponse}
            />
        </div>

    )
}

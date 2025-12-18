'use client'

import { useState, useMemo } from 'react'
import ResponsesTable from './ResponsesTable'
import ResponseDetailModal from '@/components/ResponseDetailModal'
import { MessageSquare, Filter, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react'
import { DateRangePicker } from '@/components/DateRangePicker'
import { DateRange } from 'react-day-picker'
import { isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns'

// Define the type to match what we fetch from Prisma
interface ResponseData {
    id: string
    createdAt: Date
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
    photo: string | null
    survey: {
        title: string
    }
    answers: {
        id: string
        value: string
        question: {
            id: string
            text: string
            type: string
        }
    }[]
}

type FilterType = 'ALL' | 'GOOD' | 'NORMAL' | 'BAD' | 'STAFF'

export default function ResponsesClientPage({ initialResponses }: { initialResponses: any[] }) {
    const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null)
    const [filterType, setFilterType] = useState<FilterType>('ALL')
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined
    })
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 30

    // --- FILTERING LOGIC ---
    const filteredResponses = useMemo(() => {
        return initialResponses.filter(response => {
            // 1. Filter by Type/Sentiment
            let matchesType = true

            // Calculate rating if needed (assuming first answer is usually the rating emoji/stars for quick filtering, or checking strict logic)
            // For robust filtering, we should likely look for RATING or EMOJI type questions.
            // Let's iterate answers to find a "rating-like" value.
            const ratingAnswer = response.answers.find((a: any) =>
                a.question.type === 'RATING' || a.question.type === 'EMOJI' || a.question.type === 'SELECT' // Select can also be used for satisfaction
            )

            // Heuristic for "Star/Emoji" Rating:
            // If EMOJI: usually 1-5 scale mapped or just strings. Assuming mapped in backend or we treat logic differently.
            // Simplified Logic: 
            // If rating >= 4 -> GOOD
            // If rating == 3 -> NORMAL
            // If rating <= 2 -> BAD

            // Staff Filter: Check Survey Title
            const isStaff = response.survey?.title?.toLowerCase().includes('buzón') || response.survey?.title?.toLowerCase().includes('staff')

            if (filterType === 'STAFF') {
                matchesType = isStaff
            } else if (filterType !== 'ALL') {
                // Determine score
                let score = 0
                if (ratingAnswer) {
                    // Try parsing if number
                    const val = parseInt(ratingAnswer.value)
                    if (!isNaN(val)) {
                        score = val
                    } else {
                        // Text based fallbacks for standard SELECT/EMOJI if they enter as text
                        const v = ratingAnswer.value.toLowerCase()
                        if (v.includes('excelente') || v.includes('muy bien') || v.includes('5') || v.includes('definitivamente')) score = 5
                        else if (v.includes('bueno') || v.includes('4') || v.includes('probablemente')) score = 4
                        else if (v.includes('regular') || v.includes('3')) score = 3
                        else if (v.includes('malo') || v.includes('2')) score = 2
                        else if (v.includes('muy malo') || v.includes('1')) score = 1
                    }
                }

                if (filterType === 'GOOD') matchesType = score >= 4 && !isStaff
                if (filterType === 'NORMAL') matchesType = score === 3 && !isStaff
                if (filterType === 'BAD') matchesType = score <= 2 && score > 0 && !isStaff
                // Note: Apps usually default 0 if no rating. We might want to show "Unrated" in ALL.
            }

            // 2. Filter by Date
            let matchesDate = true
            if (dateRange?.from) {
                const responseDate = new Date(response.createdAt)
                const start = startOfDay(dateRange.from)
                const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)

                matchesDate = isWithinInterval(responseDate, { start, end })
            }

            return matchesType && matchesDate
        })
    }, [initialResponses, filterType, dateRange])

    // --- PAGINATION LOGIC ---
    const totalPages = Math.ceil(filteredResponses.length / ITEMS_PER_PAGE)
    const paginatedResponses = filteredResponses.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Reset page on filter change
    useMemo(() => {
        setCurrentPage(1)
    }, [filterType, dateRange]) // Use effect-like memo or effect

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 lg:p-12 pb-24">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header & Controls */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <span className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
                                <MessageSquare className="w-8 h-8" />
                            </span>
                            Respuestas Recibidas
                        </h1>
                        <p className="text-gray-400 mt-2 ml-1">
                            {filteredResponses.length} resultados encontrados
                        </p>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-[#111] p-2 rounded-2xl border border-white/5">
                        {/* Sentiment Tabs */}
                        <div className="flex bg-black/40 p-1 rounded-xl">
                            <button
                                onClick={() => setFilterType('ALL')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'ALL' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilterType('GOOD')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'GOOD' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-emerald-400'}`}
                            >
                                😊 Buenas
                            </button>
                            <button
                                onClick={() => setFilterType('NORMAL')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'NORMAL' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-amber-400'}`}
                            >
                                😐 Normales
                            </button>
                            <button
                                onClick={() => setFilterType('BAD')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'BAD' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-red-400'}`}
                            >
                                😡 Negativas
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-2 self-center" />
                            <button
                                onClick={() => setFilterType('STAFF')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'STAFF' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-400'}`}
                            >
                                🛡️ Staff
                            </button>
                        </div>

                        {/* Date Picker */}
                        <div className="relative">
                            <DateRangePicker
                                date={dateRange}
                                setDate={setDateRange}
                            />
                            {/* Clear Date Button (Optional, can just click 'x' in most pickers or handle inside) */}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[400px]">
                    {paginatedResponses.length > 0 ? (
                        <ResponsesTable
                            responses={paginatedResponses}
                            onViewResponse={(response) => setSelectedResponse(response)}
                        />
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                            <Filter className="w-10 h-10 mb-4 opacity-50" />
                            <p>No se encontraron respuestas con estos filtros.</p>
                            <button onClick={() => { setFilterType('ALL'); setDateRange(undefined); }} className="mt-4 text-violet-400 hover:text-violet-300 text-sm">
                                Limpiar filtros
                            </button>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-white/5 pt-6">
                        <p className="text-gray-500 text-sm">
                            Mostrando <span className="text-white font-bold">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> - <span className="text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredResponses.length)}</span> de {filteredResponses.length}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-400" />
                            </button>
                            <span className="px-4 py-2 bg-white/5 rounded-lg text-sm font-mono border border-white/10">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal */}
                <ResponseDetailModal
                    isOpen={!!selectedResponse}
                    onClose={() => setSelectedResponse(null)}
                    response={selectedResponse}
                />
            </div>
        </div>
    )
}


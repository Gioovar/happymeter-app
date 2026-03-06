'use client'

import { useState, useMemo, useEffect } from 'react'
import ResponsesTable from './ResponsesTable'
import ResponseDetailModal from '@/components/ResponseDetailModal'
import { MessageSquare, Filter, ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Search, AlertCircle, CheckCircle } from 'lucide-react'
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

interface IssueTicket {
    id: string
    title: string
    description: string
    status: string
    severity: string
    resolutionNotes: string | null
    aiSummary: string | null
    isRecurring: boolean
    createdAt: Date
}

type FilterType = 'ALL' | 'GOOD' | 'NORMAL' | 'BAD' | 'STAFF'

import { useSearchParams, useRouter } from 'next/navigation'

export default function ResponsesClientPage({ initialResponses, initialTickets = [], branchName = '' }: { initialResponses: any[], initialTickets?: any[], branchName?: string }) {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Auto-open from URL
    const openId = searchParams.get('responseId')

    const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null)
    const [filterType, setFilterType] = useState<FilterType>('ALL')
    const [searchQuery, setSearchQuery] = useState('')

    // Smart Tickets State
    const [tickets, setTickets] = useState<IssueTicket[]>(initialTickets)
    const [showTickets, setShowTickets] = useState(false)

    // Check URL on mount/update
    useMemo(() => {
        if (openId && initialResponses) {
            const found = initialResponses.find(r => r.id === openId)
            if (found) {
                setSelectedResponse(found)
            }
        }
    }, [openId, initialResponses])
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined
    })
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 12

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

            // 3. Filter by Search Query
            let matchesSearch = true
            if (searchQuery.trim() !== '') {
                const query = searchQuery.toLowerCase()
                matchesSearch = response.answers.some((a: any) =>
                    a.value && a.value.toLowerCase().includes(query)
                )
            }

            return matchesType && matchesDate && matchesSearch
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [initialResponses, filterType, dateRange, searchQuery])

    // --- PAGINATION LOGIC ---
    const totalPages = Math.ceil(filteredResponses.length / ITEMS_PER_PAGE)
    const paginatedResponses = filteredResponses.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Reset page on filter change
    useMemo(() => {
        setCurrentPage(1)
    }, [filterType, dateRange, searchQuery]) // Use effect-like memo or effect

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white -mx-4 md:-mx-8">
            <div className="w-full max-w-[1600px] mx-auto space-y-8 px-4 py-8 md:px-8">
                {/* Header & Controls */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <span className="p-3 bg-violet-500/10 rounded-xl text-violet-400">
                                    <MessageSquare className="w-8 h-8" />
                                </span>
                                <span className="flex flex-col">
                                    <span>Respuestas Recibidas</span>
                                    {branchName && (
                                        <span className="text-sm font-medium text-violet-400 mt-1">
                                            Sucursal: {branchName}
                                        </span>
                                    )}
                                </span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-400">
                                {filteredResponses.length} resultados
                            </p>
                            <button
                                onClick={() => setShowTickets(!showTickets)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showTickets ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-gray-300'
                                    }`}
                            >
                                <AlertCircle className="w-4 h-4" />
                                Tickets de IA
                                {tickets.filter(t => t.status === 'OPEN').length > 0 && (
                                    <span className="bg-red-500 text-white min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] px-1 font-bold">
                                        {tickets.filter(t => t.status === 'OPEN').length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-[#111] p-2 rounded-2xl border border-white/5 overflow-x-auto w-full">
                        {/* Sentiment Tabs */}
                        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            <div className="flex bg-black/40 p-1 rounded-xl min-w-max">
                                <button
                                    onClick={() => setFilterType('ALL')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterType === 'ALL' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Todas
                                </button>
                                <button
                                    onClick={() => setFilterType('GOOD')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterType === 'GOOD' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-emerald-400'}`}
                                >
                                    😊 Buenas
                                </button>
                                <button
                                    onClick={() => setFilterType('NORMAL')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterType === 'NORMAL' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-amber-400'}`}
                                >
                                    😐 Normales
                                </button>
                                <button
                                    onClick={() => setFilterType('BAD')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterType === 'BAD' ? 'bg-red-500 text-white shadow-lg' : 'text-gray-400 hover:text-red-400'}`}
                                >
                                    😡 Negativas
                                </button>
                                <div className="w-px h-6 bg-white/10 mx-2 self-center flex-shrink-0" />
                                <button
                                    onClick={() => setFilterType('STAFF')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterType === 'STAFF' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-400'}`}
                                >
                                    🛡️ Staff
                                </button>
                            </div>
                        </div>

                        {/* Date Picker & Search */}
                        <div className="flex items-center gap-3 w-full md:w-auto mt-3 md:mt-0">
                            {/* Search Input */}
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar palabras (ej. sonido)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-md transition-colors"
                                    >
                                        <X className="w-3 h-3 text-gray-400" />
                                    </button>
                                )}
                            </div>

                            <DateRangePicker
                                date={dateRange}
                                setDate={setDateRange}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={`flex gap-6 ${showTickets ? 'flex-col xl:flex-row' : ''}`}>
                    {/* Table (Left Side when tickets split) */}
                    <div className={`bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[400px] flex-1 transition-all`}>
                        {paginatedResponses.length > 0 ? (
                            <ResponsesTable
                                responses={paginatedResponses}
                                onViewResponse={(response) => setSelectedResponse(response)}
                            />
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                                <Filter className="w-10 h-10 mb-4 opacity-50" />
                                <p>No se encontraron respuestas con estos filtros.</p>
                                <button onClick={() => { setFilterType('ALL'); setDateRange(undefined); setSearchQuery(''); }} className="mt-4 text-violet-400 hover:text-violet-300 text-sm">
                                    Limpiar filtros
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Smart Tickets Board (Right Side) */}
                    {showTickets && (
                        <div className="w-full xl:w-[400px] shrink-0 bg-[#161616] border border-white/5 rounded-2xl flex flex-col shadow-2xl h-[calc(100vh-200px)] sticky top-6">
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-indigo-400" />
                                        Board de Problemas (IA)
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">Sigue y resuelve incidencias detectadas.</p>
                                </div>
                                <button onClick={() => setShowTickets(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                                {/* Activos Section */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                                        🔴 Detectados Activos
                                        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[10px]">
                                            {tickets.filter(t => t.status === 'OPEN').length}
                                        </span>
                                    </h4>
                                    {tickets.filter(t => t.status === 'OPEN').length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No hay problemas sin resolver.</p>
                                    ) : (
                                        tickets.filter(t => t.status === 'OPEN').map(t => (
                                            <div key={t.id} className="bg-black/50 border border-white/5 rounded-xl p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-bold text-sm text-white">{t.title}</h5>
                                                    {t.isRecurring && (
                                                        <span className="text-[9px] bg-amber-500/20 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                                            Recurrente
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mb-3">{t.description}</p>
                                                {t.aiSummary && (
                                                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg text-xs italic text-indigo-300 mb-3">
                                                        💡 {t.aiSummary}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            await fetch(`/api/issues/${t.id}`, {
                                                                method: 'PATCH',
                                                                body: JSON.stringify({ status: 'RESOLVED' })
                                                            });
                                                            setTickets(prev => prev.map(tick => tick.id === t.id ? { ...tick, status: 'RESOLVED' } : tick));
                                                        }}
                                                        className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 py-1.5 rounded-lg text-xs font-medium border border-green-500/20 transition-colors"
                                                    >
                                                        Marcar Resuelto
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            await fetch(`/api/issues/${t.id}`, { method: 'DELETE' });
                                                            setTickets(prev => prev.filter(tick => tick.id !== t.id));
                                                        }}
                                                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium border border-red-500/20 transition-colors"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Resueltos Section */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                                        ✅ Historial Resuelto
                                    </h4>
                                    {tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No hay historial.</p>
                                    ) : (
                                        <div className="space-y-2 opacity-70 hover:opacity-100 transition-opacity">
                                            {tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').map(t => (
                                                <div key={t.id} className="flex items-start gap-3 p-3 bg-black/30 rounded-lg border border-white/5">
                                                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h5 className="font-medium text-sm text-gray-300 line-through decoration-white/20">{t.title}</h5>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">Marcado como resuelto</p>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            await fetch(`/api/issues/${t.id}`, {
                                                                method: 'PATCH',
                                                                body: JSON.stringify({ status: 'OPEN' })
                                                            });
                                                            setTickets(prev => prev.map(tick => tick.id === t.id ? { ...tick, status: 'OPEN' } : tick));
                                                        }}
                                                        className="ml-auto text-[10px] text-gray-400 hover:text-white underline decoration-dashed underline-offset-2"
                                                    >
                                                        Reabrir
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
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


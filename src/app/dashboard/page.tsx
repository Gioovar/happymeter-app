'use client'

import { useAuth } from '@clerk/nextjs'
import { redirect, useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
    Activity,
    Users,
    MessageSquare,
    TrendingUp,
    TrendingDown,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    Star,
    MoreHorizontal,
    Phone,
    Mail,
    Plus,
    Sparkles,
    BarChart3,
    StarHalf,
    ArrowRight,
    Download,
    Bot,
    FileText,
    QrCode,
    Info,
    Pencil,
    Check,
    X,
    Trash2,
    Zap,
    Search
} from 'lucide-react'
import Link from 'next/link'
import HelpModal from '@/components/HelpModal'
import AIReportModal from '@/components/AIReportModal'
import AnalyticsChart from '@/components/AnalyticsChart'
import ResponsesModal from '@/components/ResponsesModal'
import HappyLoader from '@/components/HappyLoader'
import QRCodeModal from '@/components/QRCodeModal'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { DateRange } from 'react-day-picker'
import { addDays } from 'date-fns'

export default function DashboardPage() {
    const { userId, isLoaded } = useAuth()
    const router = useRouter()

    const [qrModalOpen, setQrModalOpen] = useState(false)
    const [reportModalOpen, setReportModalOpen] = useState(false)
    const [helpModalOpen, setHelpModalOpen] = useState(false)
    // New State for Responses Modal
    const [viewResponsesId, setViewResponsesId] = useState<string | null>(null)
    const [viewResponsesTitle, setViewResponsesTitle] = useState('')
    const [viewResponseDetail, setViewResponseDetail] = useState<any | null>(null)
    const [selectedSurvey, setSelectedSurvey] = useState<{ url: string, title: string } | null>(null)
    const [whatsappPhone, setWhatsappPhone] = useState('')
    const [isRequestingReport, setIsRequestingReport] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    })

    // State for surveys and editing
    interface Survey {
        id: string
        title: string
        responsesCount: number // Renamed from 'responses' to avoid collision with actual responses array
        responses: any[] // Added to store actual responses for preview
        rating: number
        status: string
        date: string
    }
    const [surveys, setSurveys] = useState<Survey[]>([])
    // Granular loading states
    const [loadingSurveys, setLoadingSurveys] = useState(true)
    const [loadingAnalytics, setLoadingAnalytics] = useState(true)

    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    // Dynamic Greeting
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Buenos días'
        if (hour < 18) return 'Buenas tardes'
        return 'Buenas noches'
    }

    const openQrModal = (surveyId: string, title: string) => {
        // In a real app, get the full URL dynamically
        const url = `${window.location.origin}/s/${surveyId}`
        setSelectedSurvey({ url, title })
        setQrModalOpen(true)
    }

    const handleRequestReport = () => {
        if (!whatsappPhone) {
            alert('Por favor ingresa tu número de WhatsApp para recibir el reporte.')
            return
        }
        setIsRequestingReport(true)
        // Simulate API call
        setTimeout(() => {
            setIsRequestingReport(false)
            alert(`¡Reporte PDF con recomendaciones IA enviado a ${whatsappPhone}!`)
            setWhatsappPhone('')
        }, 2000)
    }
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/surveys/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                setSurveys(surveys.filter(s => s.id !== id))
                setDeleteConfirmId(null)
            }
        } catch (error) {
            console.error('Failed to delete survey', error)
            alert('Error al eliminar la encuesta')
        }
    }

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 >= 0.5
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

        return (
            <div className="flex items-center gap-0.5 mt-2 bg-black/20 w-fit px-2 py-1 rounded-full border border-white/5 backdrop-blur-md">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                ))}
                {hasHalfStar && <StarHalf className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} className="w-3.5 h-3.5 text-gray-700" />
                ))}
            </div>
        )
    }

    const [statsData, setStatsData] = useState<{
        totalResponses: number,
        averageSatisfaction: string,
        npsScore: number,
        activeUsers: number,
        chartData: any[],
        sentimentCounts: any[],
        topIssues: any[],
        recentFeedback: any[],
        worstFeedback: any[],
        surveysWithStats: { id: string, rating: string }[]
    }>({
        totalResponses: 0,
        averageSatisfaction: "0.0",
        npsScore: 0,
        activeUsers: 0,
        chartData: [],
        sentimentCounts: [],
        topIssues: [],
        recentFeedback: [],
        worstFeedback: [],
        surveysWithStats: []
    })

    useEffect(() => {
        const loadSurveys = async () => {
            setLoadingSurveys(true)
            try {
                const res = await fetch('/api/surveys')
                if (res.ok) {
                    const data = await res.json()
                    // Transform data to match UI expected format (initial rating 0)
                    const initialSurveys = data.map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        responsesCount: s._count?.responses || 0,
                        responses: s.responses || [],
                        rating: 0,
                        status: 'Active',
                        date: new Date(s.createdAt).toLocaleDateString()
                    }))
                    setSurveys(initialSurveys)
                }
            } catch (error) {
                console.error('Failed to fetch surveys', error)
            } finally {
                setLoadingSurveys(false)
            }
        }

        const loadAnalytics = async () => {
            setLoadingAnalytics(true)
            try {
                const res = await fetch('/api/analytics')
                if (res.ok) {
                    const data = await res.json()
                    setStatsData(data)
                }
            } catch (error) {
                console.error('Failed to fetch analytics', error)
            } finally {
                setLoadingAnalytics(false)
            }
        }

        if (userId) {
            loadSurveys()
            loadAnalytics()
        }
    }, [userId])

    // Memoized merge of surveys and ratings
    const displayedSurveys = surveys.map(s => {
        const stat = statsData.surveysWithStats.find((stat: any) => stat.id === s.id)
        return {
            ...s,
            rating: stat ? parseFloat(stat.rating) : s.rating // Use analytic rating if available
        }
    })

    // Calculate real stats from data
    const totalResponses = statsData.totalResponses
    const activeSurveys = surveys.length
    const averageSatisfaction = parseFloat(statsData.averageSatisfaction)

    const stats = [
        {
            label: 'Total Respuestas',
            value: totalResponses.toString(),
            change: '+12.5%', // Mocking positive change for God Mode effect
            trend: 'up',
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            label: 'Satisfacción Global',
            value: averageSatisfaction.toFixed(1),
            change: '+0.4',
            trend: 'up',
            icon: Star,
            color: 'from-yellow-500 to-orange-500',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20'
        },
        {
            label: 'Nps Score',
            value: statsData.npsScore.toString(),
            change: 'High',
            trend: 'neutral',
            icon: Activity,
            color: 'from-violet-500 to-fuchsia-500',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20'
        },
    ]

    const isLoading = loadingSurveys || loadingAnalytics

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30 overflow-x-hidden">
            {/* Global Loading Indicator (Custom Logo Animation) */}
            <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-4 py-3 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl transition-all duration-500 ${isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="relative w-10 h-10 flex items-center justify-center">
                    {/* Rotating Gradient Ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-transparent animate-spin [animation-duration:1s]" />

                    {/* Inner Background to mask the center of the ring */}
                    <div className="absolute inset-[2px] rounded-full bg-[#0a0a0a]" />

                    {/* The Logo Pulse */}
                    <div className="relative w-7 h-7 animate-pulse">
                        <Image
                            src="/logo-loading.png"
                            alt="Loading"
                            fill
                            className="object-contain" // Use contain to keep aspect ratio of the smiley
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white tracking-wide">Actualizando</span>
                    <span className="text-[10px] text-violet-400 font-medium">Sincronizando datos...</span>
                </div>
            </div>

            <QRCodeModal
                isOpen={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                surveyUrl={selectedSurvey?.url || ''}
                surveyTitle={selectedSurvey?.title || ''}
            />

            <AIReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
            />

            <HelpModal
                isOpen={helpModalOpen}
                onClose={() => setHelpModalOpen(false)}
            />

            <ResponsesModal
                isOpen={!!viewResponsesId}
                onClose={() => {
                    setViewResponsesId(null)
                    setViewResponseDetail(null)
                }}
                surveyId={viewResponsesId}
                surveyTitle={viewResponsesTitle}
                initialResponse={viewResponseDetail}
            />

            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
            </div>

            {/* Main Content Layout */}
            <main className="relative z-10 max-w-[1600px] mx-auto grid grid-cols-1 gap-8 pb-12">

                {/* Main Dashboard (User View Only - Full Width) */}
                <div className="lg:col-span-12 space-y-8">

                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400">
                                {getGreeting()}, <br className="md:hidden" />
                                Bienvenido.
                            </h1>
                            <p className="text-gray-400 max-w-md">Gestiona tus encuestas de satisfacción.</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/dashboard/create')}
                                className="group relative px-5 py-2.5 rounded-xl bg-white text-black font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center gap-2 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                                <Plus className="w-5 h-5 relative z-10" />
                                <span className="relative z-10">Nueva Encuesta</span>
                            </button>
                        </div>
                    </div>

                    {/* User Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, idx) => (
                            <div key={idx} className={`relative group p-6 rounded-3xl bg-[#0F0F0F] border ${stat.border} hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-2xl overflow-hidden`}>
                                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-[50px] group-hover:opacity-30 transition-opacity`} />

                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${stat.bg}`}>
                                            <stat.icon className={`w-6 h-6 text-white`} />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {stat.change}
                                            {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-4xl font-bold text-white mb-1 tracking-tight">{stat.value}</h3>
                                        <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                                    </div>

                                    <div className="h-1 w-full bg-white/5 rounded-full mt-6 overflow-hidden">
                                        <div className={`h-full w-[70%] bg-gradient-to-r ${stat.color} rounded-full`} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Trend Analysis Chart */}
                    <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 p-1 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        <div className="relative z-10 bg-[#0a0a0a] rounded-[20px] p-6 h-[350px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-violet-500" />
                                    Análisis de Tendencias
                                </h3>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 rounded-lg bg-white/5 text-xs text-gray-400 hover:text-white transition">7D</button>
                                    <button className="px-3 py-1 rounded-lg bg-white/10 text-xs text-white font-bold transition">30D</button>
                                </div>
                            </div>

                            {loadingAnalytics && statsData.chartData.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                                    <HappyLoader size="md" text="Procesando métricas..." />
                                </div>
                            ) : (
                                <AnalyticsChart data={statsData.chartData} />
                            )}
                        </div>
                    </div>

                    {/* Surveys Section Context */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                Mis Encuestas
                                <span className="text-sm font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{surveys.length}</span>
                            </h2>
                            <Link href="/dashboard/surveys" className="text-sm text-violet-400 hover:text-violet-300 font-bold flex items-center gap-1 transition">
                                Ver todas <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {loadingSurveys ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-48 rounded-2xl bg-[#0F0F0F] border border-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : displayedSurveys.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayedSurveys.map((survey) => (
                                    <div key={survey.id} className="group relative p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent flex items-center justify-center border border-white/5">
                                                    <span className="text-2xl">📊</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg group-hover:text-violet-400 transition">{survey.title}</h3>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> Creada el {survey.date}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setMenuOpenId(menuOpenId === survey.id ? null : survey.id)
                                                    }}
                                                    className="p-2 rounded-xl hover:bg-white/10 text-gray-500 hover:text-white transition"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>

                                                {menuOpenId === survey.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                        <Link href={`/dashboard/edit/${survey.id}`} className="block px-4 py-3 text-sm hover:bg-white/5">Editar</Link>
                                                        <button onClick={() => setDeleteConfirmId(survey.id)} className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5">Eliminar</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 mb-6">
                                            <div>
                                                <div className="text-2xl font-bold">{survey.responsesCount}</div>
                                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Respuestas</div>
                                            </div>
                                            <div className="w-px h-10 bg-white/10" />
                                            <div>
                                                <div className="text-2xl font-bold flex items-center gap-1">
                                                    {survey.rating} <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Rating</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/dashboard/reports/${survey.id}`} className="flex-1">
                                                <button className="w-full py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-sm font-medium transition flex items-center justify-center gap-2 text-gray-300 hover:text-white">
                                                    <FileText className="w-4 h-4" /> Reporte
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => openQrModal(survey.id, survey.title)}
                                                className="px-4 py-2.5 rounded-xl bg-violet-600/10 border border-violet-600/20 hover:bg-violet-600/20 text-violet-400 transition"
                                            >
                                                <QrCode className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <Link href="/dashboard/create" className="group rounded-3xl border-2 border-dashed border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 transition duration-300 flex flex-col items-center justify-center p-8 min-h-[250px]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-violet-500/20 flex items-center justify-center mb-4 transition duration-500 group-hover:scale-110">
                                        <Plus className="w-8 h-8 text-gray-400 group-hover:text-violet-400" />
                                    </div>
                                    <span className="font-bold text-gray-300 group-hover:text-white">Crear Nueva Encuesta</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="rounded-3xl bg-white/5 border border-white/5 p-12 text-center">
                                <p>No hay encuestas aún.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div >
    )
}

'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import {
    Activity,
    Users,
    MessageSquare,
    TrendingUp,
    TrendingDown,
    Star,
    MoreHorizontal,
    Plus,
    Sparkles,
    BarChart3,
    StarHalf,
    ArrowRight,
    FileText,
    QrCode,
    Pencil,
    Trash2,
    Zap,
} from 'lucide-react'
import Link from 'next/link'
import ExtraSurveyUpsellModal from '@/components/ExtraSurveyUpsellModal'
import LaserBorder from '@/components/ui/LaserBorder'

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
import { useDashboard } from '@/context/DashboardContext'
import { toast } from 'sonner'

interface DashboardViewProps {
    branchName?: string;
    isBranchMode?: boolean;
}

export default function DashboardView({ branchName, isBranchMode }: DashboardViewProps) {
    const { userId } = useAuth()
    const router = useRouter()

    // Access Global Dashboard State
    const {
        surveys,
        statsData,
        loadingSurveys,
        loadingAnalytics,
        refreshData,
        setSurveys
    } = useDashboard()

    // SABOTAGE SAFEGUARD: Check for pending checkout cookie
    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        }

        const pendingPlan = getCookie('checkout_plan')

        if (pendingPlan) {
            const pendingInterval = getCookie('checkout_interval')
            document.cookie = "checkout_plan=; max-age=0; path=/"
            document.cookie = "signup_intent=; max-age=0; path=/"
            document.cookie = "checkout_interval=; max-age=0; path=/"

            toast.loading('Finalizando proceso de compra...')

            const params = new URLSearchParams()
            params.set('checkout', 'true')
            params.set('plan', pendingPlan)
            if (pendingInterval) params.set('interval', pendingInterval)
            window.location.href = `/pricing?${params.toString()}`
        }
    }, [])

    const [qrModalOpen, setQrModalOpen] = useState(false)
    const [reportModalOpen, setReportModalOpen] = useState(false)
    const [helpModalOpen, setHelpModalOpen] = useState(false)
    const [viewResponsesId, setViewResponsesId] = useState<string | null>(null)
    const [viewResponsesTitle, setViewResponsesTitle] = useState('')
    const [viewResponseDetail, setViewResponseDetail] = useState<any | null>(null)
    const [selectedSurvey, setSelectedSurvey] = useState<{ url: string, title: string } | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
    const [upgradeMenuOpen, setUpgradeMenuOpen] = useState(false)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [upsellModalOpen, setUpsellModalOpen] = useState(false)

    // ... existing greeting logic ...
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Buenos días'
        if (hour < 18) return 'Buenas tardes'
        return 'Buenas noches'
    }

    const openQrModal = (surveyId: string, title: string) => {
        const url = `${window.location.origin}/s/${surveyId}`
        setSelectedSurvey({ url, title })
        setQrModalOpen(true)
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await refreshData()
        setIsRefreshing(false)
    }

    const checkLimits = () => {
        if (statsData.plan === 'ENTERPRISE') return true

        // Remove early return for POWER/CHAIN so they are checked against strict limits
        // if (statsData.plan === 'POWER' || statsData.plan === 'CHAIN') return true

        // Dynamic Import of Limits (or hardcoded map for client-side speed)
        // Simplified Map for Client
        const LIMITS_MAP: any = {
            FREE: 1,
            GROWTH: 1,
            POWER: 3,
            CHAIN: 50
        }

        const planCode = (statsData.plan || 'FREE').toUpperCase()
        const baseLimit = LIMITS_MAP[planCode] || 1
        const activeSurveys = surveys.length
        const extraSurveys = statsData.extraSurveys || 0

        const totalLimit = baseLimit + extraSurveys

        console.log('[CheckLimits]', { plan: planCode, baseLimit, activeSurveys, extraSurveys, totalLimit })

        if (activeSurveys >= totalLimit) {
            setUpsellModalOpen(true)
            return false
        }
        return true
    }

    const handleCreateSurvey = () => {
        if (checkLimits()) {
            router.push(isBranchMode ? `${window.location.pathname}/create` : '/dashboard/create')
        }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm("¿Estás seguro de eliminar esta encuesta?")) return;

        try {
            const res = await fetch(`/api/surveys/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setSurveys(surveys.filter(s => s.id !== id))
                setDeleteConfirmId(null)
            }
        } catch (error) {
            console.error('Failed to delete survey', error)
            alert('Error al eliminar la encuesta')
        }
    }

    // ... existing renderStars ...
    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 >= 0.5
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

        return (
            <div className="flex items-center gap-0.5">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                ))}
                {hasHalfStar && <StarHalf className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} className="w-3.5 h-3.5 text-gray-700" />
                ))}
            </div>
        )
    }

    const displayedSurveys = surveys.map(s => {
        const stat = statsData.surveysWithStats?.find((stat: any) => stat.id === s.id)
        return {
            ...s,
            rating: stat ? parseFloat(stat.rating) : s.rating
        }
    })

    const totalResponses = statsData.totalResponses
    const averageSatisfaction = parseFloat(statsData.averageSatisfaction)

    const getTrend = (val: number | undefined) => {
        if (!val) return 'neutral'
        return val >= 0 ? 'up' : 'down'
    }

    const formatChange = (val: number | undefined, suffix = '%') => {
        if (val === undefined || val === null) return '-'
        return (val > 0 ? '+' : '') + val + suffix
    }

    const stats = [
        {
            label: 'Total Respuestas',
            value: totalResponses.toString(),
            change: formatChange(statsData.kpiChanges?.totalResponses),
            trend: getTrend(statsData.kpiChanges?.totalResponses),
            icon: Users,
            color: 'from-blue-500 to-cyan-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            laserColor: 'blue' as const
        },
        {
            label: 'Satisfacción Global',
            value: averageSatisfaction.toFixed(1),
            change: formatChange(statsData.kpiChanges?.averageSatisfaction),
            trend: getTrend(statsData.kpiChanges?.averageSatisfaction),
            icon: Star,
            color: 'from-yellow-500 to-orange-500',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            laserColor: 'yellow' as const
        },
        {
            label: 'Probabilidad de Recomendación (NPS)',
            value: statsData.npsScore.toString() + '%',
            change: formatChange(statsData.kpiChanges?.npsScore, ' pts'), // NPS is absolute points
            trend: getTrend(statsData.kpiChanges?.npsScore),
            icon: Activity,
            color: 'from-violet-500 to-fuchsia-500',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20',
            laserColor: 'violet' as const
        },
    ]

    const isLoading = loadingSurveys || loadingAnalytics

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30 overflow-x-hidden">

            <ExtraSurveyUpsellModal
                isOpen={upsellModalOpen}
                onClose={() => setUpsellModalOpen(false)}
                currentPlanName={(statsData.plan || 'FREE').replace('_', ' ')}
            />

            <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-4 py-3 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl transition-all duration-500 ${isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-transparent animate-spin [animation-duration:1s]" />
                    <div className="absolute inset-[2px] rounded-full bg-[#0a0a0a]" />
                    <div className="relative w-7 h-7 animate-pulse">
                        <Image
                            src="/logo-loading.png"
                            alt="Loading"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white tracking-wide">Actualizando</span>
                    <span className="text-xs text-violet-400 font-medium">{branchName ? `Sincronizando ${branchName}...` : 'Sincronizando datos...'}</span>
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

            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
            </div>

            <main className="relative z-10 max-w-[1600px] mx-auto grid grid-cols-1 gap-8 pb-12">
                <div className="lg:col-span-12 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                        <div className="space-y-2">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-400">
                                    {branchName ? `Sucursal: ${branchName}` : `${getGreeting()}, Bienvenido.`}
                                    <br className="md:hidden" />
                                </h1>
                                <div className="flex items-center gap-3">
                                    <p className="text-gray-400 text-sm">
                                        {branchName ? 'Gestionando métricas de sucursal' : 'Gestiona tus encuestas de satisfacción.'}
                                    </p>

                                    {!loadingAnalytics && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-500">
                                            <div className="h-4 w-px bg-white/10 mx-2" />
                                            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statsData.plan === 'POWER' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 shadow-[0_0_10px_rgba(232,121,249,0.1)]' :
                                                statsData.plan === 'GROWTH' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(96,165,250,0.1)]' :
                                                    statsData.plan === 'CHAIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(251,191,36,0.1)]' :
                                                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                }`}>
                                                {(statsData.plan || 'FREE') === 'FREE' ? 'Plan Gratis' : `${(statsData.plan || 'FREE').replace('_', ' ')}`}
                                            </div>

                                            {statsData.plan !== 'POWER' && statsData.plan !== 'CHAIN' && statsData.plan !== 'ENTERPRISE' && !isBranchMode && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setUpgradeMenuOpen(!upgradeMenuOpen)}
                                                        className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-bold hover:bg-violet-400 transition shadow-lg shadow-violet-500/20 flex items-center gap-1"
                                                    >
                                                        <Sparkles className="w-2.5 h-2.5" /> Mejorar
                                                    </button>

                                                    {upgradeMenuOpen && (
                                                        <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                                                            <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5">
                                                                Elegir Facturación
                                                            </div>
                                                            <Link href="/pricing?interval=month" className="px-4 py-3 text-sm hover:bg-white/5 flex items-center justify-between group">
                                                                <span>Mensual</span>
                                                                <span className="text-xs text-gray-500">$24</span>
                                                            </Link>
                                                            <Link href="/pricing?interval=year" className="px-4 py-3 text-sm hover:bg-white/5 flex items-center justify-between group">
                                                                <span>Anual</span>
                                                                <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">-17%</span>
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isBranchMode && (
                                <Link
                                    href="/chains"
                                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition text-gray-400 hover:text-white"
                                    title="Volver a Cadenas"
                                >
                                    <ArrowRight className="w-5 h-5 rotate-180" />
                                </Link>
                            )}
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className={`p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition text-gray-400 hover:text-white ${isRefreshing ? 'animate-spin' : ''}`}
                                title="Recargar datos"
                            >
                                <Zap className="w-5 h-5" />
                            </button>


                            <button
                                onClick={handleCreateSurvey}
                                className="group relative px-3 md:px-5 py-2.5 rounded-xl bg-white text-black font-bold hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center gap-2 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                                <Plus className="w-5 h-5 relative z-10" />
                                <span className="relative z-10 hidden md:inline">Nueva Encuesta</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, idx) => (
                            <div key={idx} className={`relative group p-6 rounded-3xl bg-[#0F0F0F] border ${stat.border} hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-2xl overflow-hidden`}>
                                <LaserBorder color={stat.laserColor} maskClass="bg-[#0F0F0F]" />
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

                    <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 p-1 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        <div className="relative z-10 bg-[#0a0a0a] rounded-[20px] p-6 min-h-[350px] h-auto">
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
                                    <div key={survey.id} className="group relative p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/10 flex flex-col justify-between overflow-hidden">
                                        <LaserBorder color="violet" maskClass="bg-[#0F0F0F]" />

                                        <div className="relative z-10 flex flex-col justify-between h-full">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent flex items-center justify-center border border-white/5 overflow-hidden relative">
                                                        {survey.bannerUrl ? (
                                                            <div className="relative w-full h-full">
                                                                <Image
                                                                    src={survey.bannerUrl}
                                                                    alt={survey.title}
                                                                    fill
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-2xl">🍹</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg group-hover:text-violet-400 transition line-clamp-1">{survey.title}</h3>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {survey.responsesCount}</span>
                                                            <span className="flex items-center gap-1 text-yellow-500"><Star className="w-3 h-3" /> {survey.rating}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative flex gap-2">
                                                    <button
                                                        onClick={() => openQrModal(survey.id, survey.title)}
                                                        className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20 transition flex items-center gap-1"
                                                    >
                                                        <QrCode className="w-3 h-3" /> Descarga tu QR
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setMenuOpenId(menuOpenId === survey.id ? null : survey.id)
                                                        }}
                                                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition"
                                                    >
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>

                                                    {menuOpenId === survey.id && (
                                                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                            <Link href={`/dashboard/reports/${survey.id}`} className="block px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2">
                                                                <FileText className="w-4 h-4" /> Reportes
                                                            </Link>
                                                            <Link href={`/dashboard/edit/${survey.id}`} className="block px-4 py-3 text-sm hover:bg-white/5 flex items-center gap-2">
                                                                <Pencil className="w-4 h-4" /> Editar
                                                            </Link>
                                                            <button onClick={() => handleDelete(survey.id)} className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2">
                                                                <Trash2 className="w-4 h-4" /> Eliminar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="h-px w-full bg-white/5 mb-6" />

                                            <div className="mb-6">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Último Feedback</p>

                                                {survey.recentFeedbacks.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {survey.recentFeedbacks.map((feedback, idx) => (
                                                            <div
                                                                key={idx}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setViewResponsesId(survey.id)
                                                                    setViewResponsesTitle(survey.title)
                                                                    setViewResponseDetail(feedback.fullResponse)
                                                                }}
                                                                className="space-y-1 cursor-pointer group/feedback hover:bg-white/5 p-2 -mx-2 rounded-xl transition-all border border-transparent hover:border-white/5"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {survey.title.toLowerCase().includes('staff') ? (
                                                                        <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 px-1.5 py-0.5 rounded-full border border-violet-400/20">
                                                                            Empleado
                                                                        </span>
                                                                    ) : (
                                                                        renderStars(feedback.rating)
                                                                    )}
                                                                    <span className="text-xs text-gray-600 ml-auto group-hover/feedback:text-gray-400 transition-colors">
                                                                        {idx === 0 ? 'hace un momento' : feedback.date}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-300 line-clamp-1 italic group-hover/feedback:text-white transition-colors">
                                                                    "{feedback.comment}"
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-2 text-sm text-gray-600 italic">
                                                        Esperando respuestas...
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-auto space-y-4">
                                                <button
                                                    onClick={() => {
                                                        setViewResponsesId(survey.id)
                                                        setViewResponsesTitle(survey.title)
                                                        setViewResponseDetail(null)
                                                    }}
                                                    className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition font-medium"
                                                >
                                                    <MessageSquare className="w-4 h-4" /> Ver más respuestas
                                                </button>

                                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                                        {survey.status}
                                                    </span>

                                                    <Link
                                                        href={`/s/${survey.id}`}
                                                        target="_blank"
                                                        className="flex items-center gap-1 text-sm font-bold text-white hover:text-violet-400 transition"
                                                    >
                                                        Ver encuesta <ArrowRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                ))}

                                <div onClick={handleCreateSurvey} className="cursor-pointer group rounded-3xl border-2 border-dashed border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 transition duration-300 flex flex-col items-center justify-center p-8 min-h-[400px]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-violet-500/20 flex items-center justify-center mb-4 transition duration-500 group-hover:scale-110">
                                        <Plus className="w-8 h-8 text-gray-400 group-hover:text-violet-400" />
                                    </div>
                                    <span className="font-bold text-gray-300 group-hover:text-white">Crear Nueva Encuesta</span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3xl bg-white/5 border border-white/5 p-12 text-center">
                                <p>No hay encuestas aún.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

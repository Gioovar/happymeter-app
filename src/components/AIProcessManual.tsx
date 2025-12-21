'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Share2, Copy, Sparkles, TrendingUp, Users, Zap, CheckCircle2, ChevronRight, ChevronDown, MessageSquare, Star, Activity, ArrowRight, Download, Send, Calendar, Eye, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DateRange } from 'react-day-picker'
import { addDays, format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { DateRangePicker } from '@/components/DateRangePicker'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getSurveyAnalytics, getPublicSurveyAnalytics } from '@/actions/analytics'
import ShareButton from './ShareButton'
import HappyLoader from '@/components/HappyLoader'

interface AIProcessManualProps {
    surveyId: string
    surveyTitle: string
    initialIndustry?: string
    publicToken?: string // Optional token for public view
    availableSurveys?: { id: string, title: string }[]
}

export default function AIProcessManual({ surveyId, surveyTitle, initialIndustry, publicToken, availableSurveys }: AIProcessManualProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [strategiesLoading, setStrategiesLoading] = useState(false)
    const [manualData, setManualData] = useState<any>(null)
    const [showReport, setShowReport] = useState(false)
    const [showDateModal, setShowDateModal] = useState(false) // Nuevo Estado Modal
    const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7), // Por defecto últimos 7 días
        to: new Date()
    })
    const [industry, setIndustry] = useState<string>(initialIndustry || 'restaurant') // Por defecto restaurante si falla la inferencia/falta prop
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 15),
        to: new Date(),
    })
    const [isSurveySelectorOpen, setIsSurveySelectorOpen] = useState(false)

    // --- BIBLIOTECA DE ESTRATEGIAS MOVIDA AL SERVIDOR (analytics.ts) ---
    // El algoritmo detectWeaknesses ahora las genera dinámicamente.

    // Actualizar industria si cambia prop initialIndustry
    useEffect(() => {
        if (initialIndustry) setIndustry(initialIndustry)
    }, [initialIndustry])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Obtener métricas reales de BD con rango de fechas
                const from = dateRange?.from || subDays(new Date(), 30)
                const to = dateRange?.to || new Date()



                // 1. Carga Rápida (Saltar IA)
                let fastAnalytics;
                if (publicToken) {
                    fastAnalytics = await getPublicSurveyAnalytics(surveyId, publicToken, { from, to }, industry, true)
                } else {
                    fastAnalytics = await getSurveyAnalytics(surveyId, { from, to }, industry, true)
                }

                const defaultAnalytics = {
                    metrics: { totalFeedback: 0, avgRating: 0, npsScore: 0, activeUsers: 0 },
                    chartData: [],
                    sentimentData: [],
                    generatedStrategies: [],
                    staffRanking: []
                }

                setManualData({
                    ...defaultAnalytics,
                    ...(fastAnalytics || {}),
                    detailedStrategies: [], // Empezar vacío
                    recommendations: [
                        {
                            title: "Atención al Cliente",
                            desc: (fastAnalytics?.metrics?.avgRating || 0) < 4 ? "El puntaje sugiere oportunidades en trato directo." : "Mantener el estándar de excelencia.",
                            action: (fastAnalytics?.metrics?.avgRating || 0) < 4 ? "Revisar tiempos de respuesta." : "Incentivar al personal.",
                            impact: "Alto",
                            icon: Users
                        },
                        {
                            title: "Fidelización",
                            desc: `NPS de ${fastAnalytics?.metrics?.npsScore || 0} indica ${(fastAnalytics?.metrics?.npsScore || 0) > 50 ? "alta lealtad." : "riesgo de fuga."}`,
                            action: "Implementar programa de recompensas.",
                            impact: "Medio",
                            icon: TrendingUp
                        }
                    ],
                    starBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
                    topWaiter: { name: "Equipo", mentions: 0 },
                    discoveryData: [
                        { name: 'Redes Sociales', value: 45 },
                        { name: 'Google Maps', value: 30 },
                        { name: 'Recomendación', value: 25 },
                    ],
                    customerPhotos: [
                        { url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=300&h=200", comment: "¡Excelente experiencia!", rating: 5 },
                        { url: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&q=80&w=300&h=200", comment: "Muy buena atención.", rating: 5 },
                        { url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=300&h=200", comment: "Volveré pronto.", rating: 4 }
                    ]
                })

                setLoading(false) // Mostrar interfaz inmediatamente

                // 2. Carga Estrategia Asíncrona (IA Completa)
                setStrategiesLoading(true)
                try {
                    let fullAnalytics;
                    if (publicToken) {
                        fullAnalytics = await getPublicSurveyAnalytics(surveyId, publicToken, { from, to }, industry, false)
                    } else {
                        fullAnalytics = await getSurveyAnalytics(surveyId, { from, to }, industry, false)
                    }

                    if (fullAnalytics && fullAnalytics.generatedStrategies) {
                        setManualData((prev: any) => ({
                            ...prev,
                            detailedStrategies: fullAnalytics.generatedStrategies
                        }))
                    }
                } catch (aiError) {
                    console.error("AI Strategy Load Failed", aiError)
                } finally {
                    setStrategiesLoading(false)
                }

            } catch (error) {
                console.error("Error fetching analytics:", error)
                toast.error(`Error cargando datos: ${error instanceof Error ? error.message : "Error desconocido"}`)
                setLoading(false)
            }
        }

        fetchData()
    }, [surveyId, surveyTitle, initialIndustry, dateRange])

    // Generación de datos simulados no utilizada eliminada


    // lógica de compartir antigua eliminada


    const downloadPDF = async () => {
        // Seleccionar todos los contenedores de página
        const pages = document.querySelectorAll('.print-page')
        if (pages.length === 0) return

        try {
            toast.info("Generando reporte completo (esto puede tardar unos segundos)...", { duration: 3000 })

            await new Promise(resolve => setTimeout(resolve, 500))

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            for (let i = 0; i < pages.length; i++) {
                const page = pages[i] as HTMLElement

                // Navegar a páginas añadidas para iteraciones posteriores
                if (i > 0) {
                    pdf.addPage()
                }

                const canvas = await html2canvas(page, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    logging: false,
                    useCORS: true // Asegurar carga de imágenes externas (si las hay)
                })

                const imgData = canvas.toDataURL('image/png')
                const imgWidth = 210
                const imgHeight = (canvas.height * imgWidth) / canvas.width

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
            }

            pdf.save(`HappyMeter_Reporte_Completo_${format(new Date(), 'yyyy-MM-dd')}.pdf`)

            toast.success("PDF multipágina generado con éxito")
        } catch (error: any) {
            console.error("PDF Error:", error)
            toast.error("Error al generar PDF")
        }
    }



    return (
        <div className="bg-[#0f1115] text-white p-4 md:p-8 min-h-screen font-sans selection:bg-violet-500/30 relative">

            {/* Brillos de Fondo Ambiental */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Controles de Encabezado */}
            <div className="relative z-50 flex flex-col xl:flex-row items-start xl:items-center gap-8 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl shadow-lg shadow-violet-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Centro de Inteligencia IA
                        </h1>
                    </div>
                    <div className="text-gray-400 text-sm font-medium pl-1 flex items-center gap-2">
                        <span>Análisis en tiempo real para</span>
                        {availableSurveys && availableSurveys.length > 0 ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsSurveySelectorOpen(!isSurveySelectorOpen)}
                                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg text-violet-400 hover:text-violet-300 transition font-bold border border-white/5 hover:border-violet-500/30"
                                >
                                    {surveyTitle}
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSurveySelectorOpen ? 'rotate-180' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isSurveySelectorOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsSurveySelectorOpen(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-2 w-72 bg-[#1a1d26] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar"
                                            >
                                                <div className="p-2 space-y-1">
                                                    <button
                                                        onClick={() => {
                                                            router.push('/dashboard/reports')
                                                            setIsSurveySelectorOpen(false)
                                                        }}
                                                        className={`w-full text-left px-4 py-3 rounded-lg text-sm transition flex items-center justify-between ${surveyId === 'all'
                                                            ? 'bg-violet-600 text-white font-bold'
                                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                                    >
                                                        <span>Reporte General Unificado</span>
                                                        {surveyId === 'all' && <CheckCircle2 className="w-4 h-4" />}
                                                    </button>
                                                    <div className="h-px bg-white/5 my-1" />
                                                    {availableSurveys.map((survey) => (
                                                        <button
                                                            key={survey.id}
                                                            onClick={() => {
                                                                router.push(`/dashboard/reports/${survey.id}`)
                                                                setIsSurveySelectorOpen(false)
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition flex items-center justify-between ${surveyId === survey.id
                                                                ? 'bg-violet-600/20 text-violet-300 font-bold border border-violet-500/30'
                                                                : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                                                        >
                                                            <span className="truncate">{survey.title}</span>
                                                            {surveyId === survey.id && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <span className="text-violet-400">{surveyTitle}</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col-reverse md:flex-row items-end md:items-center gap-4 no-print">

                    {/* Botones de Acción */}
                    <div className="bg-[#1a1d26] p-1.5 rounded-full border border-white/10 flex items-center shadow-lg relative z-[50]">

                        <ShareButton
                            surveyId={surveyId}
                            surveyTitle={surveyTitle}
                            publicToken={publicToken}
                            variant="header"
                        />

                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button
                            onClick={() => setShowDateModal(true)}
                            className="flex items-center gap-2 px-5 py-2 text-white hover:text-white text-sm font-medium rounded-full hover:bg-white/5 transition-all"
                        >
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            Crear Reporte
                        </button>

                    </div>

                    <DateRangePicker
                        date={dateRange}
                        setDate={setDateRange}
                        onGenerate={() => {
                            // La obtención de datos se activa por useEffect cuando cambia la fecha
                            setManualData(null) // Limpiar momentáneamente para mostrar estado de carga si se desea
                            setLoading(true)
                            // El useEffect detectará el cambio o podemos dejarlo al efecto.
                            // Dado que setDate activa el efecto, este botón podría ser redundante o usado para "Actualizar".
                            // Dejemos que el efecto lo maneje.
                        }}
                    />
                </div>
            </div>
            {/* --- MODAL DE SELECCIÓN DE FECHA --- */}
            <AnimatePresence>
                {showDateModal && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1a1d26] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowDateModal(false)}
                                className="absolute top-4 right-4 text-white/40 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <Sparkles className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Nuevo Reporte IA</h3>
                                    <p className="text-white/60 text-sm">Elige el periodo a analizar</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <DateRangePicker
                                    date={selectedDateRange}
                                    setDate={(range) => setSelectedDateRange(range)}
                                    inline={true}
                                />
                            </div>

                            <button
                                onClick={() => {
                                    if (selectedDateRange?.from && selectedDateRange?.to) {
                                        setDateRange(selectedDateRange) // Actualizar estado global
                                        setShowDateModal(false)
                                        setShowReport(true) // Abrir vista de reporte que activa la obtención
                                        // La obtención forzada se maneja por useEffect al cambiar dateRange
                                    }
                                }}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                            >
                                <Sparkles className="w-5 h-5" />
                                Generar Estrategias
                            </button>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* --- MODAL DE REPORTE (Vista Web Modo Oscuro) --- */}
            <AnimatePresence>
                {showReport && manualData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed inset-0 z-[9999] bg-[#0f1115] overflow-y-auto"
                    >
                        <div className="max-w-5xl mx-auto p-8 relative">
                            {/* Botón Cerrar */}
                            <button
                                onClick={() => setShowReport(false)}
                                className="fixed top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md z-50 shadow-lg"
                            >
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>

                            {/* --- Página 1: Resumen Ejecutivo (Modo Oscuro) --- */}
                            <div className="mb-12 md:mb-24">
                                <div className="text-center mb-8 md:mb-16 mt-8 md:mt-0">
                                    <div className="inline-flex p-3 bg-violet-500/10 rounded-2xl mb-4 border border-violet-500/20">
                                        <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-violet-400" />
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">Reporte de Inteligencia Artificial</h1>
                                    <p className="text-sm md:text-xl text-gray-400 px-4">Análisis detallado y estrategias de optimización para <br className="hidden md:block" />{surveyTitle}</p>
                                </div>

                                {/* Cuadrícula de Métricas */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                                    <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-gray-400 mb-2 font-medium text-sm">
                                            <MessageSquare className="w-4 h-4" /> Feedback Total
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-white">{manualData.metrics.totalFeedback.toLocaleString()}</div>
                                        <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> +12% vs mes anterior
                                        </div>
                                    </div>
                                    <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-gray-400 mb-2 font-medium text-sm">
                                            <Activity className="w-4 h-4" /> NPS Score
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-violet-400">+{manualData.metrics.npsScore}</div>
                                        <div className="text-xs text-gray-500 mt-2">Nivel Excelente</div>
                                    </div>
                                    <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-2 text-gray-400 mb-2 font-medium text-sm">
                                            <Star className="w-4 h-4" /> Promedio
                                        </div>
                                        <div className="text-2xl md:text-3xl font-bold text-amber-400">{manualData.metrics.avgRating}</div>
                                        <div className="flex mt-2">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} className={`w-3 h-3 ${s <= Math.round(manualData.metrics.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="flex items-center gap-2 text-gray-400 mb-2 font-medium text-sm relative z-10">
                                            <Sparkles className="w-4 h-4 text-yellow-400" /> Top Mesero
                                        </div>
                                        <div className="text-xl font-bold text-white relative z-10">{manualData.topWaiter?.name}</div>
                                        <div className="text-xs text-violet-300 mt-2 relative z-10">{manualData.topWaiter?.mentions} menciones positivas</div>
                                    </div>
                                </div>

                                {/* Gráficos */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8">
                                    <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
                                        <h3 className="text-lg font-bold text-white mb-6">Tendencia de Feedback</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={manualData.chartData}>
                                                    <defs>
                                                        <linearGradient id="colorValueModal" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: 'white' }}
                                                        itemStyle={{ color: '#a78bfa' }}
                                                    />
                                                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorValueModal)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
                                        <h3 className="text-lg font-bold text-white mb-6">Distribución de Sentimiento</h3>
                                        <div className="space-y-4">
                                            {manualData.sentimentData.map((item: any) => (
                                                <div key={item.name} className="relative group">
                                                    <div className="flex justify-between text-sm mb-2 font-medium">
                                                        <span className="text-gray-300">{item.name}</span>
                                                        <span className="text-white">{item.value}%</span>
                                                    </div>
                                                    <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${item.value}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                            className={`h-full bg-gradient-to-r ${item.color} ${item.glow}`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* --- Página 2-4: Estrategias (Modo Oscuro) --- */}
                            <div className="space-y-24">
                                {/* Mostrar Cargador si Estrategias Cargando */}
                                {strategiesLoading && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                        <HappyLoader size="md" text="Analizando métricas con IA para generar estrategias..." />
                                        <p className="text-gray-500 text-sm max-w-md">Esto puede tomar unos segundos mientras HappyMeter AI 2.0 Gemini procesa el feedback.</p>
                                    </div>
                                )}

                                {!strategiesLoading && (manualData.detailedStrategies || []).map((strategy: any, i: number) => (
                                    <div key={i} className="border-t border-white/10 pt-16">
                                        <div className="mb-8">
                                            <span className="text-violet-400 font-bold uppercase tracking-widest text-xs mb-2 block">Estrategia #{i + 1}</span>
                                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{strategy.title}</h2>
                                            <p className="text-xl text-gray-400">{strategy.objective}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                            {/* Tarjeta de Plan de Acción (Problema y Mejor Práctica) */}
                                            <div className="bg-gradient-to-br from-violet-900/20 to-fuchsia-900/20 border border-violet-500/20 p-8 rounded-2xl">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                                                        <TrendingUp className="w-6 h-6 rotate-180" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white">Problema Detectado</h3>
                                                </div>
                                                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                                                    "{strategy.problemDetected}"
                                                </p>

                                                <div className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                                                    <div className="p-1.5 bg-emerald-500/20 rounded-lg mt-0.5">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold uppercase text-emerald-400 block mb-1">Mejor Práctica (Solución):</span>
                                                        <span className="text-base font-medium text-white leading-snug">{strategy.bestPractice}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pasos de Implementación */}
                                            <div className="space-y-4">
                                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">🛠</div>
                                                    Plan de Acción Paso a Paso
                                                </h3>
                                                {strategy.steps.map((step: any, idx: number) => (
                                                    <div key={idx} className="flex gap-4 p-4 bg-[#1a1d26] rounded-xl border border-white/5 hover:border-violet-500/30 transition-colors">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold text-sm">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-white font-medium mb-1">{step.title}</h4>
                                                            <p className="text-sm text-gray-400">{step.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>


                                ))}
                            </div>

                            {/* CTA Inferior */}
                            <div className="mt-12 md:mt-24 text-center pb-12 flex flex-col md:flex-row justify-center gap-3 md:gap-4 px-4 md:px-0">
                                <ShareButton
                                    surveyId={surveyId}
                                    surveyTitle={surveyTitle}
                                    publicToken={publicToken}
                                    variant="footer"
                                    className="w-full md:w-auto"
                                />
                                <button
                                    onClick={downloadPDF}
                                    className="px-6 py-3 bg-slate-800 text-white font-bold rounded-full hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 border border-slate-700 w-full md:w-auto text-sm md:text-base"
                                >
                                    <Download className="w-5 h-5" />
                                    Descargar PDF (Impresión)
                                </button>
                                <button
                                    onClick={() => setShowReport(false)}
                                    className="px-6 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 transition-colors border border-white/10 w-full md:w-auto text-sm md:text-base"
                                >
                                    Cerrar Reporte
                                </button>
                            </div>

                        </div>
                    </motion.div >
                )
                }
            </AnimatePresence >

            {/* --- PLANTILLA PDF AHORRO DE TINTA (Contenedor Oculto) --- */}
            < div style={{ position: 'fixed', top: 0, left: 0, zIndex: -50, opacity: 0, pointerEvents: 'none' }}>
                {manualData && (
                    <>
                        {/* PÁGINA 1: Resumen Ejecutivo */}
                        <div className="print-page" style={{ width: '210mm', minHeight: '297mm', background: 'white', color: '#0f172a', padding: '15mm', fontFamily: 'sans-serif', border: '1px solid #f0f0f0', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', height: '100%' }}>
                                {/* Encabezado */}
                                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                            <Sparkles size={24} color="#7c3aed" />
                                            <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#7c3aed' }}>HappyMeter Intelligence</span>
                                        </div>
                                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, lineHeight: 1.1 }}>Reporte Ejecutivo</h1>
                                        <p style={{ fontSize: '18px', color: '#64748b', margin: '5px 0 0 0' }}>{surveyTitle}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8' }}>Fecha de Emisión</p>
                                        <p style={{ fontSize: '14px', fontWeight: '500' }}>{format(new Date(), "d 'de' MMMM, yyyy", { locale: es })}</p>
                                    </div>
                                </div>

                                {/* Métricas */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                    <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}>Total Feedback</p>
                                        <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a' }}>{manualData.metrics.totalFeedback}</p>
                                    </div>
                                    <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}>NPS Score</p>
                                        <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c3aed' }}>+{manualData.metrics.npsScore}</p>
                                    </div>
                                    <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}>Calificación</p>
                                        <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{manualData.metrics.avgRating}</p>
                                    </div>
                                    <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <p style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold', marginBottom: '5px' }}>Mesero Top</p>
                                        <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{manualData.topWaiter?.name}</p>
                                        <p style={{ fontSize: '12px', color: '#64748b' }}>{manualData.topWaiter?.mentions} menciones</p>
                                    </div>
                                </div>

                                {/* Gráficos */}
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', height: '240px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#0f172a' }}>Tendencia</h3>
                                        <div style={{ height: '160px', width: '100%' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={manualData.chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                                    <Area type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} fill="none" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', color: '#0f172a' }}>Sentimiento</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {manualData.sentimentData.map((item: any, i: number) => (
                                                <div key={i}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px' }}>
                                                        <span style={{ fontWeight: '500' }}>{item.name}</span>
                                                        <span style={{ fontWeight: 'bold' }}>{item.value}%</span>
                                                    </div>
                                                    <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                                                        <div style={{
                                                            width: `${item.value}%`,
                                                            height: '100%',
                                                            borderRadius: '4px',
                                                            backgroundColor: item.name === 'Positivo' ? '#10b981' : item.name === 'Negativo' ? '#f43f5e' : '#3b82f6'
                                                        }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Lista Resumen de Estrategias */}
                                <div style={{ marginTop: '10px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', borderLeft: '4px solid #7c3aed', paddingLeft: '15px', marginBottom: '20px', color: '#0f172a' }}>Resumen de Estrategias</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {(manualData.detailedStrategies || []).slice(0, 5).map((strategy: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#0f172a' }}>{strategy.title}</h4>
                                                    <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{strategy.objective}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                                    Página 1 - Resumen Ejecutivo
                                </div>
                            </div>
                        </div>

                        {/* Mostrar Cargador si Estrategias Cargando */}
                        {strategiesLoading && (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                <HappyLoader size="md" text="Analizando métricas con IA para generar estrategias..." />
                                <p className="text-gray-500 text-sm max-w-md">Esto puede tomar unos segundos mientras HappyMeter AI 2.0 Gemini procesa el feedback.</p>
                            </div>
                        )}


                        {/* PÁGINAS 2+: Estrategias Detalladas (Una por página) */}
                        {!strategiesLoading && (manualData.detailedStrategies || []).map((strategy: any, i: number) => (
                            <div key={i} className="print-page" style={{ width: '210mm', minHeight: '297mm', background: 'white', color: '#0f172a', padding: '15mm', fontFamily: 'sans-serif', border: '1px solid #f0f0f0', marginBottom: '20px', pageBreakBefore: 'always' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', height: '100%' }}>

                                    {/* Encabezado Pequeño */}
                                    <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Sparkles size={16} color="#7c3aed" />
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', color: '#7c3aed' }}>HappyMeter Intelligence</span>
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                            Estrategia #{i + 1}
                                        </div>
                                    </div>

                                    {/* Título */}
                                    <div>
                                        <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#7c3aed', display: 'block', marginBottom: '10px' }}>Estrategia Recomendada</span>
                                        <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{strategy.title}</h2>
                                    </div>

                                    {/* Caja Problema / Solución */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                        {/* Problema */}
                                        <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '12px 12px 0 0', border: '1px solid #fee2e2', borderBottom: 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <TrendingUp size={16} color="#ef4444" style={{ transform: 'rotate(180deg)' }} />
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#ef4444' }}>Problema Detectado</span>
                                            </div>
                                            <p style={{ fontSize: '15px', color: '#7f1d1d', fontStyle: 'italic', margin: 0 }}>
                                                "{strategy.problemDetected}"
                                            </p>
                                        </div>
                                        {/* Solución */}
                                        <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '0 0 12px 12px', border: '1px solid #dcfce7' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <CheckCircle2 size={16} color="#16a34a" />
                                                <span style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#16a34a' }}>Mejor Práctica</span>
                                            </div>
                                            <p style={{ fontSize: '15px', fontWeight: '500', color: '#14532d', margin: 0 }}>
                                                {strategy.bestPractice}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Pasos */}
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px', borderBottom: '2px solid #0f172a', paddingBottom: '10px', display: 'inline-block' }}>Plan de Implementación</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            {strategy.steps.map((step: any, idx: number) => (
                                                <div key={idx} style={{ display: 'flex', gap: '15px' }}>
                                                    <div style={{
                                                        width: '24px', height: '24px', backgroundColor: '#0f172a', color: 'white', borderRadius: '50%',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', flexShrink: 0, marginTop: '2px'
                                                    }}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>{step.title}</h4>
                                                        <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '10px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                                        Página {i + 2} - HappyMeter Intelligence
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                )}


                {/* CONTENIDO PRINCIPAL DEL TABLERO (Se ocultará al imprimir) */}
                < div className="dashboard-content" >
                    {
                        loading ? (
                            <div className="h-[60vh] flex flex-col items-center justify-center space-y-8 relative z-10" >
                                <HappyLoader size="lg" text="Procesando Datos..." />
                            </div>
                        ) : !manualData ? (
                            <div className="h-[40vh] flex items-center justify-center text-gray-500">
                                No hay datos disponibles para este periodo.
                            </div>
                        ) : (
                            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                                {/* Fila de Estadísticas Superiores - estilo como referencia */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        {
                                            label: "Total Respuestas",
                                            value: manualData.metrics.totalFeedback,
                                            trend: "+12.5%",
                                            footer: "Total Respuestas",
                                            gradient: "from-blue-500 to-cyan-400",
                                            glow: "shadow-[0_0_20px_rgba(56,189,248,0.3)]",
                                            icon: Users,
                                            progress: 65
                                        },
                                        {
                                            label: "Satisfacción Global",
                                            value: manualData.metrics.avgRating,
                                            trend: "+0.4",
                                            footer: "Satisfacción Global",
                                            gradient: "from-orange-500 to-amber-400",
                                            glow: "shadow-[0_0_20px_rgba(251,191,36,0.3)]",
                                            icon: Star,
                                            progress: (manualData.metrics.avgRating / 5) * 100
                                        },
                                        {
                                            label: "NPS Score",
                                            value: manualData.metrics.npsScore,
                                            trend: "High",
                                            footer: "Probabilidad De Recomendación (NPS)",
                                            gradient: "from-violet-500 to-fuchsia-400",
                                            glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
                                            icon: Activity,
                                            progress: manualData.metrics.npsScore // Assuming NPS 0-100
                                        }
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-[#15171e]/80 backdrop-blur-md border border-white/5 p-6 rounded-[24px] relative overflow-hidden group"
                                        >
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                    <stat.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full border border-white/10 bg-white/5 ${i === 0 ? 'text-emerald-400' : i === 1 ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                    {stat.trend} ↗
                                                </span>
                                            </div>

                                            <div className="mb-6">
                                                <h3 className="text-4xl font-bold text-white mb-1">{stat.value}</h3>
                                                <p className="text-sm text-gray-500 font-medium">{stat.footer}</p>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full bg-gradient-to-r ${stat.gradient} ${stat.glow} w-[${stat.progress}%]`} style={{ width: `${stat.progress}%` }} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Main Charts Area - Compacted */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                                    {/* Area Chart - Feedback Trend */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="lg:col-span-2 bg-[#15171e]/80 backdrop-blur-md border border-white/5 p-5 rounded-[24px] min-h-[280px]"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-base font-bold text-white">Tendencia de Feedback</h3>
                                            <select className="bg-black/20 border border-white/10 text-[10px] text-gray-400 rounded-lg px-2 py-1 outline-none">
                                                <option>Mensual</option>
                                                <option>Semanal</option>
                                            </select>
                                        </div>
                                        <div className="h-[200px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={manualData?.chartData || []}>
                                                    <defs>
                                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)', fontSize: '12px' }}
                                                        itemStyle={{ color: '#fff' }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#8b5cf6"
                                                        strokeWidth={3}
                                                        fillOpacity={1}
                                                        fill="url(#colorValue)"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </motion.div>

                                    {/* Sentiment Analysis - Styled like reference */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-[#15171e]/80 backdrop-blur-md border border-white/5 p-5 rounded-[24px] flex flex-col justify-center min-h-[280px]"
                                    >
                                        <h3 className="text-base font-bold text-white mb-4">Análisis de Sentimiento</h3>

                                        <div className="space-y-6">
                                            {manualData.sentimentData.map((item: any, i: number) => {
                                                const styles: Record<string, { color: string, glow: string }> = {
                                                    'Positivo': { color: 'from-blue-500 to-cyan-400', glow: 'shadow-[0_0_15px_rgba(56,189,248,0.5)]' },
                                                    'Neutral': { color: 'from-orange-500 to-amber-400', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.5)]' },
                                                    'Negativo': { color: 'from-violet-500 to-fuchsia-400', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]' }
                                                }
                                                const style = styles[item.name] || { color: 'from-gray-400 to-gray-500', glow: '' }

                                                return (
                                                    <div key={i} className="relative group">
                                                        <div className="flex justify-between text-xs font-bold mb-2">
                                                            <span className="text-gray-300">{item.name}</span>
                                                            <span className="text-white">{item.value}%</span>
                                                        </div>
                                                        {/* Background Bar */}
                                                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                                            {/* Foreground Glowing Bar */}
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${item.value}%` }}
                                                                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                                                className={`h-full rounded-full bg-gradient-to-r ${style.color} ${style.glow} shadow-lg relative`}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className="mt-6 p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                                            <p className="text-xl font-bold text-white mb-0.5">{Math.round((manualData.sentimentData.find((s: any) => s.name === 'Positivo')?.value || 0) + (manualData.sentimentData.find((s: any) => s.name === 'Neutral')?.value || 0) / 2)}%</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Satisfacción General</p>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* AI Chat Manual Section - CTA */}
                                <div className="bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 border border-white/10 p-6 md:p-8 rounded-[24px] md:rounded-[32px] flex flex-col md:flex-row items-center justify-between relative overflow-hidden group gap-6 md:gap-0 text-center md:text-left">
                                    <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_right,transparent,black,transparent)]" />

                                    <div className="relative z-10 max-w-2xl px-2">
                                        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 justify-center md:justify-start">
                                            <Sparkles className="w-6 h-6 text-fuchsia-400 animate-pulse hidden md:block" />
                                            ¿Necesitas un Plan de Acción Detallado?
                                        </h2>
                                        <p className="text-gray-300 text-base md:text-lg">
                                            Tu asistente <span className="text-violet-400 font-bold">HappyMeter Analyst</span> ya analizó estos datos. Habla con él para obtener un manual paso a paso personalizado.
                                        </p>
                                    </div>

                                    <div className="relative z-10 flex items-center w-full md:w-auto justify-center">
                                        <a
                                            href="/dashboard/chat"
                                            className="flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition transform shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)] w-full md:w-auto text-sm md:text-base"
                                        >
                                            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                                            Iniciar Conversación IA
                                        </a>
                                    </div>

                                    {/* Decorator */}
                                    <div className="absolute -right-20 -bottom-20 opacity-20 group-hover:opacity-30 transition duration-500">
                                        <Sparkles className="w-64 h-64 text-fuchsia-500 blur-3xl" />
                                    </div>
                                </div>

                            </div>
                        )}
                </div>
            </div>



            {/* --- PRINT ONLY REPORT (HIDDEN ON SCREEN) ---  DEPRECATED/REMOVED */}
            {/* This section was removed in concept but kept in code structure to prevent errors if invoked, though effectively empty now or minimal legacy support */}

        </div >
    )
}

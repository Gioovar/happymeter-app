
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import { TrendingUp, Users, Star, Activity, ArrowUpRight, MessageSquare, MoreHorizontal, X, Mail, Phone, ArrowRight, ArrowDownRight, Minus } from 'lucide-react'
import AITopIssues from './AITopIssues'
import MenuInsights from '@/components/MenuInsights'
import StaffLeaderboard from '@/components/StaffLeaderboard'

interface DetailedAnalyticsProps {
    data: {
        totalResponses: number
        averageSatisfaction: string
        npsScore: number
        activeUsers: number
        chartData: any[]
        sentimentCounts: any[]
        topIssues: any[]
        recentFeedback: any[]
        bestFeedback: any[]
        worstFeedback: any[]
        kpiChanges?: {
            totalResponses: number
            averageSatisfaction: number
            npsScore: number
        }
        sourceChartData?: { name: string, value: number }[]
        staffRanking?: { name: string, count: number, average: string }[]
    }
    isStaffSurvey?: boolean
}

export default function DetailedAnalytics({ data, isStaffSurvey = false }: DetailedAnalyticsProps) {
    const COLORS = ['#22c55e', '#3b82f6', '#ec4899'] // Neon Green (Good), Metallic Blue (Neutral), Neon Pink (Bad)
    const [selectedFeedback, setSelectedFeedback] = useState<any>(null)

    const renderChangeBadge = (value: number | undefined, isPercentage: boolean = true) => {
        if (value === undefined) return null
        const isPositive = value > 0
        const isNeutral = value === 0
        const colorClass = isPositive ? 'text-green-400 bg-green-400/10' : isNeutral ? 'text-gray-400 bg-gray-400/10' : 'text-red-400 bg-red-400/10'

        return (
            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${colorClass}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {value > 0 ? '+' : ''}{value}{isPercentage ? '%' : ''}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* ... stats/charts ... */}
            {/* Top KPIs */}
            {/* Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 hover:border-violet-500/20 transition-all duration-300 group relative overflow-hidden">
                    {/* Laser Border Effect */}
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#8b5cf6_360deg)] animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute inset-[1px] rounded-2xl z-0 bg-[#111111]" />

                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition z-10">
                        <MessageSquare className="w-16 h-16 text-violet-500 transform rotate-12" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                                <MessageSquare className="w-4 h-4" />
                            </div>
                            <p className="text-gray-400 text-sm font-medium">Total Respuestas</p>
                        </div>
                        {renderChangeBadge(data.kpiChanges?.totalResponses)}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1 relative z-10">{data.totalResponses}</h3>
                    <div className="h-10 w-full mt-2 relative z-10">
                        {/* Mini Sparkline Simulation */}
                        <div className="w-full h-full bg-gradient-to-t from-violet-500/10 to-transparent rounded-lg border-b border-violet-500/20" />
                    </div>
                </div>

                <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 hover:border-yellow-500/20 transition-all duration-300 group relative overflow-hidden">
                    {/* Laser Border Effect */}
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#eab308_360deg)] animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute inset-[1px] rounded-2xl z-0 bg-[#111111]" />

                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition z-10">
                        <Star className="w-16 h-16 text-yellow-500 transform rotate-12" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                                <Star className="w-4 h-4" />
                            </div>
                            <p className="text-gray-400 text-sm font-medium">Calificación</p>
                        </div>
                        {renderChangeBadge(data.kpiChanges?.averageSatisfaction)}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1 relative z-10">{data.averageSatisfaction}/5</h3>
                    <div className="mt-2 w-full bg-white/5 h-1.5 rounded-full overflow-hidden relative z-10">
                        <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full" style={{ width: `${(parseFloat(data.averageSatisfaction) / 5) * 100}%` }} />
                    </div>
                </div>

                <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all duration-300 group relative overflow-hidden">
                    {/* Laser Border Effect */}
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#3b82f6_360deg)] animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute inset-[1px] rounded-2xl z-0 bg-[#111111]" />

                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition z-10">
                        <Activity className="w-16 h-16 text-blue-500 transform rotate-12" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                <Activity className="w-4 h-4" />
                            </div>
                            <p className="text-gray-400 text-sm font-medium">NPS Score</p>
                        </div>
                        {renderChangeBadge(data.kpiChanges?.npsScore, false)}
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1 relative z-10">
                        {data.npsScore > 0 ? '+' : ''}{data.npsScore}%
                    </h3>
                    <div className="h-10 w-full mt-2 opacity-50 relative z-10">
                        <div className="w-full h-full bg-gradient-to-t from-blue-500/10 to-transparent rounded-lg border-b border-blue-500/20" />
                    </div>
                </div>

                <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 hover:border-green-500/20 transition-all duration-300 group relative overflow-hidden">
                    {/* Laser Border Effect */}
                    <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,#22c55e_360deg)] animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute inset-[1px] rounded-2xl z-0 bg-[#111111]" />

                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition z-10">
                        <Users className="w-16 h-16 text-green-500 transform rotate-12" />
                    </div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                                <Users className="w-4 h-4" />
                            </div>
                            <p className="text-gray-400 text-sm font-medium">Usuarios Activos</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1 relative z-10">{data.activeUsers}</h3>
                    <div className="h-10 w-full mt-2 opacity-50 relative z-10">
                        <div className="w-full h-full bg-gradient-to-t from-green-500/10 to-transparent rounded-lg border-b border-green-500/20" />
                    </div>
                </div>
            </div>

            {/* Best/Worst Feedback Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Best Feedback */}
                <div
                    className="bg-[#111111] p-6 rounded-2xl border border-green-500/20 relative overflow-hidden group cursor-pointer hover:border-green-500/40 transition"
                    onClick={() => data.bestFeedback[0] && setSelectedFeedback(data.bestFeedback[0])}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <Star className="w-12 h-12 text-green-500/10 fill-green-500/10" />
                    </div>
                    <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                        <Star className="fill-green-400 w-4 h-4" /> Mejor Comentario
                    </h3>
                    {data.bestFeedback && data.bestFeedback[0] ? (
                        <>
                            <p className="text-lg text-white italic mb-4 line-clamp-2">"{data.bestFeedback[0].feedback || 'Sin texto'}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xs uppercase">
                                    {data.bestFeedback[0].user?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{data.bestFeedback[0].user}</p>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < data.bestFeedback[0].rating ? 'fill-green-400 text-green-400' : 'text-gray-700'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500 text-sm">No hay comentarios positivos aún.</p>
                    )}
                </div>

                {/* Worst Feedback */}
                <div
                    className="bg-[#111111] p-6 rounded-2xl border border-pink-500/20 relative overflow-hidden group cursor-pointer hover:border-pink-500/40 transition"
                    onClick={() => data.worstFeedback[0] && setSelectedFeedback(data.worstFeedback[0])}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-50">
                        <TrendingUp className="w-12 h-12 text-pink-500/10 rotate-180" />
                    </div>
                    <h3 className="text-pink-400 font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 rotate-180" /> Peor Comentario
                    </h3>
                    {data.worstFeedback && data.worstFeedback[0] ? (
                        <>
                            <p className="text-lg text-white italic mb-4 line-clamp-2">"{data.worstFeedback[0].feedback || 'Sin texto'}"</p>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xs uppercase">
                                    {data.worstFeedback[0].user?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{data.worstFeedback[0].user}</p>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-3 h-3 ${i < data.worstFeedback[0].rating ? 'fill-pink-400 text-pink-400' : 'text-gray-700'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500 text-sm">No hay comentarios negativos aún.</p>
                    )}
                </div>
            </div>

            {/* Middle Section: Trend & Sentiment */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Feedback Trend - Takes 2 cols */}
                <div className="lg:col-span-2 bg-[#111111] p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Tendencia de Feedback</h3>
                        <select className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1 text-gray-400 outline-none">
                            <option>Volumen Diario</option>
                            <option>Volumen Semanal</option>
                        </select>
                    </div>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.chartData}>
                                <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="respuestas" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sentiment Analysis - Takes 1 col */}
                <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                    <h3 className="font-bold text-lg w-full text-left mb-4">Análisis de Sentimiento</h3>
                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <defs>
                                    <linearGradient id="gradPositive" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#22c55e" />
                                        <stop offset="100%" stopColor="#4ade80" />
                                    </linearGradient>
                                    <linearGradient id="gradNeutral" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#60a5fa" />
                                    </linearGradient>
                                    <linearGradient id="gradNegative" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#ec4899" />
                                        <stop offset="100%" stopColor="#f472b6" />
                                    </linearGradient>
                                </defs>
                                <Pie
                                    data={data.sentimentCounts}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.sentimentCounts.map((entry, index) => {
                                        const gradientId =
                                            entry.name === 'Positivo' ? 'url(#gradPositive)' :
                                                entry.name === 'Neutral' ? 'url(#gradNeutral)' :
                                                    'url(#gradNegative)';
                                        return <Cell key={`cell-${index}`} fill={gradientId} style={{ filter: 'drop-shadow(0px 0px 4px rgba(255,255,255,0.2))' }} stroke="none" />;
                                    })}
                                </Pie>
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                            <div className="text-center">
                                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    {data.totalResponses}
                                </p>
                                <p className="text-xs text-gray-500">Total</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Source Chart - New Section */}
                {/* Source Chart - Modern & Dynamic Redesign */}
            </div>

            {/* New Section: Traffic Sources & Staff Ranking Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source Chart - Modern & Dynamic Redesign */}
                <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                    {/* Background Glow Effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-[80px] pointer-events-none rounded-full group-hover:bg-violet-600/20 transition duration-700" />

                    <h3 className="font-bold text-xl mb-6 flex items-center gap-3 relative z-10">
                        <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Fuentes de Tráfico
                        </span>
                    </h3>

                    <div className="w-full h-[250px] relative z-10">
                        {data.sourceChartData && data.sourceChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data.sourceChartData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                                    barSize={24}
                                >
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#d946ef" />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.03)" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={100}
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        fontWeight={500}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#d1d5db' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(139, 92, 246, 0.05)', radius: 8 }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl">
                                                        <p className="text-gray-400 text-xs mb-1">Visitantes</p>
                                                        <p className="text-white font-bold text-lg flex items-center gap-2">
                                                            {payload[0].value}
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">Top</span>
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        fill="url(#barGradient)"
                                        radius={[0, 100, 100, 0]}
                                        animationDuration={1500}
                                    >
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 text-sm">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                    <Activity className="w-5 h-5 text-gray-600" />
                                </div>
                                <p>No hay datos de fuentes aún.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Staff Ranking */}
                <div>
                    <StaffLeaderboard staffRanking={data.staffRanking || []} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Feedback Table - Takes 2 cols */}
                <div className="lg:col-span-2 bg-[#111111] p-6 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">Feedback Reciente</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-500 border-b border-white/5">
                                <tr>
                                    <th className="py-3 font-medium">Usuario</th>
                                    <th className="py-3 font-medium">Comentario</th>
                                    <th className="py-3 font-medium">Calificación</th>
                                    <th className="py-3 font-medium text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentFeedback.map((item, idx) => (
                                    <tr
                                        key={idx}
                                        onClick={() => setSelectedFeedback(item)}
                                        className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                                    >
                                        <td className="py-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                                                {item.user.charAt(0)}
                                            </div>
                                            <span className="font-medium">{item.user}</span>
                                        </td>
                                        <td className="py-4 text-gray-400 max-w-[200px] truncate" title={item.feedback}>
                                            {item.feedback}
                                        </td>
                                        <td className="py-4">
                                            {isStaffSurvey ? (
                                                <span className="text-xs font-bold text-violet-400 bg-violet-400/10 px-2 py-1 rounded-full border border-violet-400/20">
                                                    Empleado
                                                </span>
                                            ) : (
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-3 h-3 ${i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-700'}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 text-right">
                                            <button className="p-1 hover:bg-white/10 rounded">
                                                <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {data.recentFeedback.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-500">
                                            No se encontró feedback reciente.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Issues - Takes 1 col */}
                <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 flex flex-col">
                    <h3 className="font-bold text-lg mb-4">Problemas Detectados (IA)</h3>
                    <div className="flex-1 min-h-[300px]">
                        <AITopIssues />
                    </div>
                </div>

                {/* Menu Insights Section - Full Width */}
                <div className="lg:col-span-3">
                    <MenuInsights />
                </div>
            </div>

            {/* Feedback Details Modal - Updated Design */}
            {
                selectedFeedback && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setSelectedFeedback(null)}
                    >
                        <div
                            className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-4 flex items-center justify-between shrink-0">
                                <button
                                    onClick={() => setSelectedFeedback(null)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <button onClick={() => setSelectedFeedback(null)} className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">
                                    Volver <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 pt-0 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                                {/* User Profile */}
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ${['bg-violet-500', 'bg-fuchsia-500', 'bg-blue-500'][(selectedFeedback.user?.length || 0) % 3]
                                        }`}>
                                        {selectedFeedback.user?.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">{selectedFeedback.user}</h3>
                                    <p className="text-gray-500 text-sm mb-2">
                                        {/* Try to format date with time, fallback to regular date string */}
                                        {(() => {
                                            try {
                                                // Assume date might be ISO or parseable
                                                const dateObj = new Date(selectedFeedback.date)
                                                if (isNaN(dateObj.getTime())) return selectedFeedback.date // Fallback if invalid
                                                return format(dateObj, "d 'de' MMMM 'de' yyyy HH:mm", { locale: es })
                                            } catch (e) {
                                                return selectedFeedback.date
                                            }
                                        })()}
                                    </p>
                                    <div className="flex text-yellow-500 gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${i < selectedFeedback.rating ? 'fill-current' : 'text-gray-700'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Quote Box */}
                                <div className="bg-[#1a1a1a] rounded-xl p-6 text-center border border-white/5">
                                    <p className="text-lg text-gray-300 italic">"{selectedFeedback.feedback || 'Sin comentarios'}"</p>
                                </div>

                                {/* Photo Evidence */}
                                {selectedFeedback.photo && (
                                    <div className="flex flex-col items-center">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 self-start px-2">FOTO DE EXPERIENCIA</h4>
                                        <div
                                            className="relative group cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#1a1a1a] w-full h-48"
                                            onClick={() => window.open(selectedFeedback.photo, '_blank')}
                                        >
                                            <img
                                                src={selectedFeedback.photo}
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

                                {/* Survey Summary - Details */}
                                <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
                                    <div className="px-5 py-4 border-b border-white/5">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">RESUMEN DE ENCUESTA</h4>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {selectedFeedback.details && selectedFeedback.details.map((detail: any, i: number) => (
                                            <div key={i} className="flex justify-between items-start gap-4 text-sm">
                                                <span className="text-gray-400 font-medium flex-1">{detail.question}:</span>
                                                <span className="text-white font-semibold text-right">{detail.answer}</span>
                                            </div>
                                        ))}
                                        {(!selectedFeedback.details || selectedFeedback.details.length === 0) && (
                                            <div className="text-gray-500 text-sm text-center">No hay detalles adicionales.</div>
                                        )}
                                    </div>
                                </div>


                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 pt-2 shrink-0 grid grid-cols-3 gap-3">
                                {/* WhatsApp */}
                                <a
                                    href={selectedFeedback.phone ? `https://wa.me/${selectedFeedback.phone.replace(/[^0-9]/g, '')}` : '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${selectedFeedback.phone
                                        ? 'bg-[#1a3826] border-[#25D366]/20 text-[#25D366] hover:bg-[#1a3826]/80'
                                        : 'bg-white/5 border-white/5 text-gray-600 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <MessageSquare className="w-6 h-6 mb-2" />
                                </a>

                                {/* Call */}
                                <a
                                    href={selectedFeedback.phone ? `tel:${selectedFeedback.phone.replace(/[^0-9]/g, '')}` : '#'}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${selectedFeedback.phone
                                        ? 'bg-[#1a2b4b] border-blue-500/20 text-blue-400 hover:bg-[#1a2b4b]/80'
                                        : 'bg-white/5 border-white/5 text-gray-600 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <Phone className="w-6 h-6 mb-2" />
                                </a>

                                {/* Mail */}
                                <a
                                    href={selectedFeedback.email ? `mailto:${selectedFeedback.email}` : '#'}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition ${selectedFeedback.email
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
        </div >
    )
}

'use client'

import { useState, useEffect } from 'react'
import {
    BarChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Legend
} from 'recharts'
import {
    TrendingUp,
    Users,
    UserMinus,
    UserPlus,
    DollarSign,
    Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GrowthChart() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [range, setRange] = useState('30d')

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/analytics/growth?range=${range}`)
                if (res.ok) {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const json = await res.json()
                        setData(json)
                    }
                }
            } catch (error) {
                console.error("Failed to load growth stats", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [range])

    if (loading && !data) {
        return <div className="h-64 rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
    }

    if (!data) return null

    const { metrics, chartData } = data

    return (
        <div className="rounded-3xl bg-[#0F0F0F] border border-white/5 p-6 mb-8 group relative overflow-hidden">
            {/* Decorator */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-400" />
                        Crecimiento del Ecosistema
                    </h3>
                    <p className="text-sm text-gray-400">Afiliados, Encuestas vs Ingresos</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl">
                    {['30d', '90d', '1y'].map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                range === r
                                    ? "bg-violet-600 text-white shadow-lg"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {r === '1y' ? '1 Año' : r.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 relative z-10">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <UserPlus className="w-4 h-4 text-yellow-400" /> Nuevos
                    </div>
                    <div className="text-2xl font-bold text-white">+{metrics.totalNew}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <UserMinus className="w-4 h-4 text-red-400" /> Salidas
                    </div>
                    <div className="text-2xl font-bold text-white">-{metrics.totalChurn}</div>
                </div>
                {/* NEW: Survey Metric */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Calendar className="w-4 h-4 text-green-400" /> Encuestas
                    </div>
                    <div className="text-2xl font-bold text-white">+{metrics.totalSurveys}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Users className="w-4 h-4 text-violet-400" /> Neto
                    </div>
                    <div className={cn("text-2xl font-bold", metrics.netGrowth >= 0 ? "text-green-400" : "text-red-400")}>
                        {metrics.netGrowth > 0 ? '+' : ''}{metrics.netGrowth}
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <DollarSign className="w-4 h-4 text-blue-400" /> Ingresos
                    </div>
                    <div className="text-2xl font-bold text-white">${metrics.totalRevenue.toLocaleString()}</div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[350px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <defs>
                            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorChurn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSurveys" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        {/* Left Axis: People count */}
                        <YAxis
                            yAxisId="left"
                            stroke="#666"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        {/* Right Axis: Revenue */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#3b82f6"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `$${val}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />

                        <Bar
                            yAxisId="left"
                            dataKey="newCreators"
                            name="Nuevos Afiliados"
                            fill="url(#colorNew)"
                            barSize={20}
                            radius={[4, 4, 0, 0]}
                        />
                        {/* NEW: Survey Bar */}
                        <Bar
                            yAxisId="left"
                            dataKey="surveys"
                            name="Encuestas Nuevas"
                            fill="url(#colorSurveys)"
                            barSize={20}
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="churn"
                            name="Salidas"
                            fill="url(#colorChurn)"
                            barSize={20}
                            radius={[4, 4, 0, 0]}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="revenue"
                            name="Ingresos ($)"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={false}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

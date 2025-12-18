'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, ArrowDownRight, Minus, Calendar } from 'lucide-react'

interface RevenueChartProps {
    data: {
        comparisons: {
            daily: { current: number, previous: number, growth: number },
            weekly: { current: number, previous: number, growth: number },
            monthly: { current: number, previous: number, growth: number }
        },
        chartData: { date: string, value: number }[]
    }
}

export default function RevenueChart({ data }: RevenueChartProps) {
    const { comparisons } = data

    const renderMetric = (label: string, current: number, growth: number) => {
        const isPositive = growth > 0
        const isNeutral = growth === 0
        return (
            <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/10 transition">
                <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">{label}</p>
                    <p className="text-2xl font-bold text-white">${current.toLocaleString()}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-500/10 text-green-400' : isNeutral ? 'bg-gray-500/10 text-gray-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(growth)}%
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Comparison Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderMetric('Ingresos Hoy', comparisons.daily.current, comparisons.daily.growth)}
                {renderMetric('Esta Semana', comparisons.weekly.current, comparisons.weekly.growth)}
                {renderMetric('Este Mes', comparisons.monthly.current, comparisons.monthly.growth)}
            </div>

            {/* Chart */}
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-violet-500" />
                            Rendimiento de Ingresos
                        </h3>
                        <p className="text-sm text-gray-400">Comportamiento de los últimos 30 días.</p>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.chartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} />
                            <YAxis
                                stroke="#6b7280"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

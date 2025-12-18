'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { TrendingUp, Info } from 'lucide-react'


interface AnalyticsChartProps {
    data?: any[]
}

export default function AnalyticsChart({ data = [] }: AnalyticsChartProps) {
    return (
        <div className="w-full h-full bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-violet-500/20">
                        <TrendingUp className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Tendencia de Respuestas</h3>
                        <p className="text-xs text-gray-400">Últimos 30 días</p>
                    </div>
                </div>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSatisfaction" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        {/* Left Axis: Responses */}
                        <YAxis
                            yAxisId="left"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        {/* Right Axis: Satisfaction (1-5) */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#22c55e"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 5]}
                            tickFormatter={(value) => `${value}★`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#9ca3af' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />

                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="respuestas"
                            name="Respuestas"
                            stroke="#8b5cf6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorResponses)"
                        />
                        <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="satisfaccion"
                            name="Satisfacción (1-5)"
                            stroke="#22c55e"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorSatisfaction)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

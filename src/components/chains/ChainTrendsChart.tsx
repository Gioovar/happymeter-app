'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BranchMetric, TrendDataPoint } from '@/actions/chain-analytics'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ChainTrendsChartProps {
    data: TrendDataPoint[]
    branches: BranchMetric[]
}

export default function ChainTrendsChart({ data, branches }: ChainTrendsChartProps) {
    if (!data || data.length === 0) return null

    // Format dates for X Axis (e.g. "Jan 23")
    const formattedData = data.map(d => {
        // Append T12:00:00 to avoid UTC midnight shifting back a day in western timezones
        const dateObj = new Date(`${d.date}T12:00:00`)
        return {
            ...d,
            formattedDate: dateObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
        }
    })

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#111] border border-white/10 p-3 rounded-lg shadow-xl space-y-2">
                    <p className="text-gray-400 text-xs font-medium mb-1">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-gray-300 w-24 truncate">{entry.name}:</span>
                            <span className="text-white font-bold">{entry.value}</span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <Card className="bg-[#111] border-white/5 h-full">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-violet-500" />
                    Análisis de Tendencias (Satisfacción)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formattedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                {branches.map((branch) => (
                                    <linearGradient key={branch.branchId} id={`gradient-${branch.branchId}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={branch.color || '#fff'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={branch.color || '#fff'} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="formattedDate"
                                stroke="#6b7280"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#6b7280"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 10]}
                                tickCount={6}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20' }} />
                            <Legend
                                wrapperStyle={{ paddingTop: '20px' }}
                                iconType="circle"
                                formatter={(value, entry: any) => {
                                    const branch = branches.find(b => b.branchId === entry.dataKey)
                                    return <span className="text-gray-400 text-xs">{value} ({branch?.surveys || 0})</span>
                                }}
                            />

                            {branches.map((branch) => (
                                <Area
                                    key={branch.branchId}
                                    type="monotone"
                                    dataKey={branch.branchId}
                                    name={branch.name}
                                    stroke={branch.color || '#fff'}
                                    strokeWidth={3}
                                    fill={`url(#gradient-${branch.branchId})`}
                                    fillOpacity={1}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: branch.color }}
                                    connectNulls
                                    isAnimationActive={true}
                                    animationDuration={1500}
                                    animationEasing="ease-out"
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <div className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-500 font-medium">Últimos 30 días</div>
                </div>
            </CardContent>
        </Card>
    )
}

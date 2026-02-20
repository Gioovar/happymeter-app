"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserX, XCircle, CheckCircle, TrendingUp, Clock, CalendarDays } from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'

interface AnalyticsData {
    totalReservations: number
    totalPax: number
    noShowRate: string
    cancelRate: string
    confirmedRate: string
    peakHours: { time: string, count: number }[]
    weekDistribution: { day: string, count: number }[]
    statusDistribution: { name: string, value: number }[]
}

const COLORS = ['#10b981', '#71717a', '#ef4444', '#f59e0b']

export function ReservationsAnalytics({ data }: { data: AnalyticsData }) {
    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-zinc-400">Total Reservas</p>
                            <CalendarDays className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="flex items-baseline space-x-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{data.totalReservations}</h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-zinc-400">Total Pax (Personas)</p>
                            <Users className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex items-baseline space-x-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{data.totalPax}</h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-zinc-400">Tasa de Asistencia</p>
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex items-baseline space-x-2">
                            <h2 className="text-2xl font-bold text-emerald-500 tracking-tight">{data.confirmedRate}%</h2>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-zinc-400">Tasa de No-Shows</p>
                            <UserX className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="flex items-baseline space-x-2">
                            <h2 className="text-2xl font-bold text-red-500 tracking-tight">{data.noShowRate}%</h2>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución Semanal */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-400" />
                            Demanda por Día de la Semana
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.weekDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="day" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                                <RechartsTooltip
                                    cursor={{ fill: '#27272a' }}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="count" name="Reservas" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-emerald-400" />
                            Distribución de Estados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Peak Hours List */}
                <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-400" />
                            Horarios Pico (Top 5)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {data.peakHours.map((peak, i) => (
                                <div key={i} className="flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-xl border border-white/5">
                                    <span className="text-2xl font-bold text-white">{peak.time}</span>
                                    <span className="text-xs text-zinc-500 mt-1">{peak.count} reservas totales</span>
                                </div>
                            ))}
                            {data.peakHours.length === 0 && (
                                <p className="text-sm text-zinc-500 col-span-5 text-center">No hay datos de horarios disponibles.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

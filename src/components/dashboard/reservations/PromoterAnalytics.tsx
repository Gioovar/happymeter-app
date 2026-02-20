"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserX, CheckCircle, DollarSign, TrendingUp, Calendar } from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface PromoterStats {
    totalReservations: number
    confirmedAttendees: number
    noShows: number
    revenue: number
    conversionRate: number
}

export function PromoterAnalytics({ stats, promoter }: { stats: PromoterStats, promoter: any }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-sm font-medium text-zinc-400">Total Reservas</p>
                            <Calendar className="h-4 w-4 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">{stats.totalReservations}</h2>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-sm font-medium text-zinc-400">Asistentes Confirmados</p>
                            <Users className="h-4 w-4 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">{stats.confirmedAttendees}</h2>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-sm font-medium text-zinc-400">No-Shows</p>
                            <UserX className="h-4 w-4 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">{stats.noShows}</h2>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-sm font-medium text-zinc-400">Comisión Est. (Hoy)</p>
                            <DollarSign className="h-4 w-4 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            ${promoter.commissionType === 'PER_PERSON'
                                ? stats.confirmedAttendees * promoter.commissionValue
                                : '0'} {/* Add logic for % later */}
                        </h2>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Trend Placeholder */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-400" />
                        Rendimiento de Conversión
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-center h-[200px] flex flex-col items-center justify-center border-t border-white/5">
                    <p className="text-4xl font-black text-indigo-500">{stats.conversionRate.toFixed(1)}%</p>
                    <p className="text-zinc-500 text-sm">Tasa de Efectividad (Checked-in / Reservas)</p>
                </CardContent>
            </Card>
        </div>
    )
}

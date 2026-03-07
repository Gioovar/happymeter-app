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
    guestTypes?: {
        new: number
        returning: number
        vip: number
    }
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

            {/* Customer Loyalty Breakdown */}
            {stats.guestTypes && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-400" />
                            Loyalty ROI Tracking (Generado por RP)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <div className="grid grid-cols-3 gap-4 text-center border-t border-white/5 pt-6">
                            <div>
                                <p className="text-3xl font-black text-indigo-400">{stats.guestTypes.new}</p>
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mt-1">Nuevos</p>
                            </div>
                            <div className="border-x border-white/5">
                                <p className="text-3xl font-black text-emerald-400">{stats.guestTypes.returning}</p>
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mt-1">Recurrentes</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-amber-500">{stats.guestTypes.vip}</p>
                                <p className="text-zinc-500 text-xs uppercase tracking-wider mt-1">VIP (5+)</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

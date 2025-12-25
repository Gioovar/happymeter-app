
'use client'

import { useState, useEffect } from 'react'
import { Copy, DollarSign, Users, MousePointer2, TrendingUp, Sparkles, ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import CreatorChat from '@/components/CreatorChat'

export default function CreatorDashboard() {
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/creators/stats')
            if (res.ok) {
                const json = await res.json()
                setData(json)

                // Onboarding Check: If profile exists but missing niche (required field in form), redirect
                // PENDING status is okay, but missing data needs form.
                if (json.profile && !json.profile.niche) {
                    window.location.href = '/creators/onboarding'
                }
            }
        } catch (error) {
            console.error('Failed to fetch creator stats', error)
        } finally {
            setIsLoading(false)
        }
    }

    const copyLink = () => {
        if (!data?.profile?.code) return
        const link = `${window.location.origin}?ref=${data.profile.code}`
        navigator.clipboard.writeText(link)
        toast.success('¡Enlace copiado! 🚀')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        )
    }

    const referralLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${data?.profile?.code}` : ''

    // Blocking View for Pending State
    if (data?.profile?.status === 'PENDING') {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center p-6 text-white">
                <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shrink-0 animate-pulse">
                        <Sparkles className="w-12 h-12 text-yellow-500" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-500">
                            Perfil en Revisión
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            ¡Gracias por completar tu perfil! 🎉
                            <br /><br />
                            Hemos notificado a nuestro equipo. Tu cuenta está siendo analizada para asignarte la mejor comisión posible.
                        </p>
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-sm text-gray-500">
                        <p>Recibirás una notificación por WhatsApp en cuanto tu cuenta sea aprobada.</p>
                    </div>

                    <div className="pt-8">
                        <CreatorChat userId={data.profile.userId} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-violet-500/30">
            {/* Header */}


            <main className="max-w-6xl mx-auto px-6 py-12 pt-24 space-y-12">

                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white">
                        ¡Hola, Creador! 👋
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Estás listo para monetizar tu audiencia. Gana el <span className="text-violet-400 font-bold">{data?.profile?.commissionRate || 30}%</span> de cada suscripción que traigas.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 relative overflow-hidden group hover:scale-[1.02] transition duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition">
                            <MousePointer2 className="w-24 h-24 text-violet-500 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-violet-300 uppercase tracking-wider mb-2">Visitas</p>
                            <h3 className="text-4xl font-bold text-white">{data?.stats?.visitors || 0}</h3>
                            <p className="text-sm text-gray-500 mt-2">Clics en tu enlace</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 relative overflow-hidden group hover:scale-[1.02] transition duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                            <Users className="w-24 h-24 text-blue-500 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-2">Leads</p>
                            <h3 className="text-4xl font-bold text-white">{data?.stats?.leads || 0}</h3>
                            <p className="text-sm text-gray-500 mt-2">Registros gratuitos</p>
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 relative overflow-hidden group hover:scale-[1.02] transition duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition">
                            <DollarSign className="w-24 h-24 text-green-500 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-green-300 uppercase tracking-wider mb-2">Ganancias</p>
                            <h3 className="text-4xl font-bold text-white">${data?.stats?.totalCommission?.toFixed(2) || '0.00'} MXN</h3>
                            <p className="text-sm text-gray-500 mt-2">Comisiones totales</p>
                        </div>
                    </div>

                    {/* Growth Chart */}
                    <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-violet-400" />
                                    Tendencia de Visitas
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Tráfico en tu enlace los últimos 7 días</p>
                            </div>
                            {/* Optional: Add period selector here if needed */}
                        </div>

                        <div className="h-[300px] w-full">
                            {data?.chartData && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => `${value}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff' }}
                                            labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                                            formatter={(value: number) => [`${value} visitas`, 'Tráfico']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="visits"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorVisits)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                            {!data?.chartData && (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Link Generator */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <ExternalLink className="w-6 h-6 text-violet-400" />
                                Tu Enlace Mágico
                            </h3>
                            <p className="text-gray-400">Comparte este link en tus redes, videos o blog. La cookie dura 30 días.</p>
                        </div>

                        <div className="w-full md:w-auto flex-1 max-w-xl">
                            <div className="flex items-center gap-2 bg-black/30 p-2 rounded-2xl border border-white/10">
                                <code className="flex-1 text-violet-300 font-mono px-4 truncate">
                                    {referralLink}
                                </code>
                                <button
                                    onClick={copyLink}
                                    className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition shadow-lg shadow-violet-600/20 flex items-center gap-2"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                        Actividad Reciente
                    </h3>

                    <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
                        {data?.profile?.referrals?.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>Aún no hay actividad. ¡Comparte tu enlace para empezar!</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-xs font-bold text-gray-400 uppercase">
                                    <tr>
                                        <th className="p-6">Evento</th>
                                        <th className="p-6">Estado</th>
                                        <th className="p-6 text-right">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data?.profile?.referrals?.slice(0, 5).map((ref: any) => (
                                        <tr key={ref.id} className="hover:bg-white/5 transition">
                                            <td className="p-6 font-medium">Nuevo Registro</td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ref.status === 'CONVERTED'
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                    {ref.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right text-gray-500 text-sm">
                                                {new Date(ref.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="pt-8">
                    <CreatorChat userId={data?.profile?.userId} />
                </div>

            </main>
        </div>
    )
}

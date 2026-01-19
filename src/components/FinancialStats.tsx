'use client'

import { useState, useEffect } from 'react'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { cn } from '@/lib/utils'

export default function FinancialStats() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/analytics/financial?range=30d')
                if (res.ok) {
                    const contentType = res.headers.get("content-type");
                    if (contentType && contentType.indexOf("application/json") !== -1) {
                        const json = await res.json()
                        setData(json)
                    }
                }
            } catch (error) {
                console.error("Failed to load financial stats", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />
                ))}
            </div>
        )
    }

    if (!data) return null

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val)
    }

    const { income, expenses, net, trend, recent } = data

    return (
        <div className="space-y-6 mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-400" />
                Finanzas (Últimos 30 días)
            </h2>

            {/* Main Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Income */}
                <div className="relative group overflow-hidden p-6 rounded-2xl border border-white/5 bg-[#111] backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-50" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Ingresos Totales</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">
                                {formatCurrency(income)}
                            </h3>
                            <div className="flex items-center gap-1 mt-2 text-green-400 text-xs font-medium">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>+12% vs mes anterior</span>
                            </div>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                </div>

                {/* Expenses */}
                <div className="relative group overflow-hidden p-6 rounded-2xl border border-white/5 bg-[#111] backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Gastos (Comisiones)</p>
                            <h3 className="text-3xl font-bold text-white tracking-tight">
                                {formatCurrency(expenses)}
                            </h3>
                            <div className="flex items-center gap-1 mt-2 text-red-400 text-xs font-medium">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>+5% vs mes anterior</span>
                            </div>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                            <TrendingDown className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Net Profit */}
                <div className="relative group overflow-hidden p-6 rounded-2xl border border-white/5 bg-[#111] backdrop-blur-md">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-50" />
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-400 mb-1">Beneficio Neto</p>
                            <h3 className={cn("text-3xl font-bold tracking-tight", net >= 0 ? "text-white" : "text-red-400")}>
                                {formatCurrency(net)}
                            </h3>
                            <div className="flex items-center gap-1 mt-2 text-blue-400 text-xs font-medium">
                                <Activity className="w-3 h-3" />
                                <span>Margen: {income > 0 ? ((net / income) * 100).toFixed(1) : 0}%</span>
                            </div>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                            <Wallet className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-[#111] backdrop-blur-md">
                    <h4 className="text-sm font-medium text-gray-400 mb-4">Tendencia de Ingresos vs Gastos</h4>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                                <YAxis
                                    stroke="#666"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                                    itemStyle={{ fontSize: '12px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                    name="Ingresos"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                    name="Gastos"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent List */}
                <div className="p-6 rounded-2xl border border-white/5 bg-[#111] backdrop-blur-md">
                    <h4 className="text-sm font-medium text-gray-400 mb-4">Transacciones Recientes</h4>
                    <div className="space-y-4">
                        {recent.length === 0 ? (
                            <p className="text-sm text-gray-500">Sin movimientos recientes.</p>
                        ) : (
                            recent.map((item: any, i: number) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center",
                                            item.type === 'income' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                        )}>
                                            {item.type === 'income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{item.label}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(item.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "font-medium text-sm",
                                        item.type === 'income' ? "text-green-400" : "text-red-400"
                                    )}>
                                        {item.type === 'income' ? "+" : "-"}{formatCurrency(item.amount)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

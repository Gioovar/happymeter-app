import { prisma } from '@/lib/prisma'
import { Users, Building, Activity, DollarSign, ShieldCheck, TrendingUp, TrendingDown, CreditCard, UserCheck, UserX } from 'lucide-react'
import FinancialStats from '@/components/FinancialStats'
import GrowthChart from '@/components/GrowthChart'
import PayoutsTable from '@/components/admin/PayoutsTable'
import ActivityFeed from '@/components/ActivityFeed'
import AIBriefing from '@/components/AIBriefing'
import ManagementSuggestions from '@/components/ManagementSuggestions'
import Link from 'next/link'
import StatCard from '@/components/admin/StatCard'
import { getGlobalStats, getFinancialStats } from '@/actions/admin-dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
    const [globalStats, financeStats] = await Promise.all([
        getGlobalStats(),
        getFinancialStats()
    ])

    const adminStats = [
        {
            label: 'Usuarios Totales',
            value: globalStats.users.total,
            subValue: `+${globalStats.users.newLast30Days} nuevos (30d)`,
            trend: 'up',
            icon: Users,
            color: 'from-blue-500 to-indigo-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            label: 'MRR (Mensual)',
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(financeStats.mrr),
            subValue: `ARR: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(financeStats.arr)}`,
            trend: 'up',
            icon: DollarSign,
            color: 'from-green-500 to-emerald-500',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20'
        },
        {
            label: 'Suscripciones Activas',
            value: financeStats.activeSubscribers,
            subValue: `${((financeStats.activeSubscribers / globalStats.users.total) * 100).toFixed(1)}% conversión`,
            trend: 'neutral',
            icon: CreditCard,
            color: 'from-violet-500 to-purple-500',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20'
        },
        {
            label: 'Red de Sucursales',
            value: globalStats.network.branches,
            subValue: `${globalStats.network.chains} Cadenas activas`,
            trend: 'up',
            icon: Building,
            color: 'from-orange-500 to-amber-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
        },
        {
            label: 'Encuestas Activas',
            value: globalStats.usage.surveys,
            subValue: `${globalStats.usage.responses} Respuestas totales`,
            trend: 'up',
            icon: Activity,
            color: 'from-pink-500 to-rose-500',
            bg: 'bg-pink-500/10',
            border: 'border-pink-500/20'
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Background Glow Effect - Deep Blue/Purple as requested */}
            <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[800px] bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent blur-[120px] pointer-events-none -z-10" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5 relative z-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-[10px] font-bold text-orange-300 uppercase tracking-widest">
                            God Mode Active
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-amber-200">
                        Centro de Mando
                    </h1>
                    <p className="text-gray-400">Visión global de HappyMeter SaaS</p>
                </div>
            </div>

            {/* KPI Grid - Expanded to 5 cols for cleaner look on large screens, or wrap */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 relative z-10">
                {adminStats.map((stat, idx) => (
                    <StatCard
                        key={idx}
                        label={stat.label}
                        value={stat.value}
                        subValue={stat.subValue}
                        icon={stat.icon}
                        color={stat.color}
                        trend={stat.trend as any}
                    />
                ))}
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

                {/* Main Column (8 cols) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Growth Analytics (New Feature) */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <GrowthChart />
                    </div>

                    {/* Financial Metrics (God Mode) */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 space-y-8">
                        <FinancialStats />
                        <PayoutsTable />
                    </div>

                    {/* Management Roadmap (New) */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                        <ManagementSuggestions />
                    </div>
                </div>

                {/* Sidebar Column (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* AI Executive Summary */}
                    <AIBriefing />

                    {/* Live Feed & Status - Sticky Group */}
                    <div className="sticky top-4 space-y-6">
                        <div className="h-[400px]">
                            <ActivityFeed />
                        </div>

                        {/* Plan Breakdown Mini-Card */}
                        <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Distribución de Planes</h3>
                            <div className="space-y-3">
                                {Object.entries(financeStats.planBreakdown).map(([plan, count]) => (
                                    <div key={plan} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 capitalize">{plan.toLowerCase().replace('_', ' ')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-violet-500 rounded-full"
                                                    style={{ width: `${(count / financeStats.activeSubscribers) * 100}%` }}
                                                />
                                            </div>
                                            <span className="font-bold text-white">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Status Mockup */}
                        <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-6">
                            <h3 className="text-lg font-bold text-white mb-6">Alertas del Sistema</h3>
                            <div className="flex flex-col items-center justify-center h-40 text-center">
                                <ShieldCheck className="w-12 h-12 text-orange-500 mb-3 opacity-20" />
                                <p className="text-gray-500">Todos los sistemas operativos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

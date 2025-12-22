import { prisma } from '@/lib/prisma'
import { Users, Building, Activity, DollarSign, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react'
import FinancialStats from '@/components/FinancialStats'
import GrowthChart from '@/components/GrowthChart'
import PayoutsTable from '@/components/admin/PayoutsTable'
import ActivityFeed from '@/components/ActivityFeed'
import AIBriefing from '@/components/AIBriefing'
import ManagementSuggestions from '@/components/ManagementSuggestions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getAdminStats() {
    try {
        const [
            totalUsers,
            totalSurveys,
            totalResponses,
        ] = await Promise.all([
            prisma.userSettings.count(),
            prisma.survey.count(),
            prisma.response.count(),
        ])

        return { totalUsers, totalSurveys, totalResponses }
    } catch (error) {
        console.error("Error fetching admin stats:", error)
        // Return default values to prevent page crash
        return { totalUsers: 0, totalSurveys: 0, totalResponses: 0 }
    }
}

export default async function AdminDashboardPage() {
    const stats = await getAdminStats()

    const adminStats = [
        {
            label: 'Usuarios Totales',
            value: stats.totalUsers,
            change: '+12%',
            trend: 'up',
            icon: Users,
            color: 'from-orange-500 to-red-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
        },
        {
            label: 'Encuestas Activas',
            value: stats.totalSurveys,
            change: '+5%',
            trend: 'up',
            icon: Building,
            color: 'from-amber-500 to-yellow-500',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20'
        },
        {
            label: 'Respuestas Globales',
            value: stats.totalResponses,
            change: '+24%',
            trend: 'up',
            icon: Activity,
            color: 'from-red-500 to-rose-500',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20'
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

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {adminStats.map((stat, idx) => (
                            <div key={idx} className={`relative group p-6 rounded-3xl bg-[#0F0F0F] border ${stat.border} hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 shadow-2xl overflow-hidden`}>
                                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${stat.color} opacity-20 blur-[50px] group-hover:opacity-30 transition-opacity`} />

                                <div className="relative z-10 flex flex-col justify-between h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${stat.bg}`}>
                                            <stat.icon className={`w-6 h-6 text-white`} />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                            {stat.change}
                                            {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-4xl font-bold text-white mb-1 tracking-tight">{stat.value}</h3>
                                        <p className="text-sm text-gray-400 font-medium">{stat.label}</p>
                                    </div>

                                    <div className="h-1 w-full bg-white/5 rounded-full mt-6 overflow-hidden">
                                        <div className={`h-full w-[70%] bg-gradient-to-r ${stat.color} rounded-full`} />
                                    </div>
                                </div>
                            </div>
                        ))}
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

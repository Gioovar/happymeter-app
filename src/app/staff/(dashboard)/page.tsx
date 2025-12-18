import { prisma } from '@/lib/prisma'
import { Users, MessageSquare, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import PendingCreatorCard from '@/components/staff/PendingCreatorCard'
import { getRevenueStats, getRevenueAnalytics } from '@/actions/staff-finance'
import { getGodModeData } from '@/actions/god-mode' // NEW
import { DollarSign, Wallet } from 'lucide-react'
import RevenueChart from '@/components/staff/RevenueChart'
import LiveTicker from '@/components/staff/LiveTicker'
import GodModeStats from '@/components/staff/GodModeStats'
import TopCreators from '@/components/staff/TopCreators'

export default async function StaffDashboardPage() {
    const revenue = await getRevenueStats()
    const analytics = await getRevenueAnalytics()
    const godMode = await getGodModeData()

    // Stats
    const pendingCount = await prisma.affiliateProfile.count({ where: { status: 'PENDING' } })
    const activeChatsCount = await prisma.adminChat.count({ where: { status: 'OPEN' } })
    const totalCreators = await prisma.affiliateProfile.count()
    const activeCreators = await prisma.affiliateProfile.count({ where: { status: 'ACTIVE' } })

    // Feeds
    const pendingCreators = await prisma.affiliateProfile.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 3
    })

    const recentLogs = await prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="min-h-screen">
            {/* Full Width Ticker */}
            <LiveTicker />

            <div className="p-8 max-w-[1600px] mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase tracking-tight">
                            Command Center
                        </h1>
                        <p className="text-gray-400 mt-1 font-mono text-xs tracking-wider">SYSTEM STATUS: ONLINE | V: 2.4.0</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/staff/creators" className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition text-sm flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Directorio
                        </Link>
                    </div>
                </div>

                {/* PENDING REQUESTS ALERT - MOVED TO TOP */}
                {pendingCount > 0 && (
                    <div className="mb-8 p-1">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="relative">
                                <AlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />
                                <div className="absolute inset-0 bg-yellow-500/50 blur-lg animate-pulse" />
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Acciones Requeridas</h3>
                            <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]">{pendingCount}</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {pendingCreators.map(c => (
                                <PendingCreatorCard key={c.id} creator={c} />
                            ))}
                        </div>
                    </div>
                )}

                {/* GOD MODE STATS (NEW) */}
                <GodModeStats data={godMode.stats} />

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* LEFT COLUMN (2/3): Financials & Charts */}
                    <div className="xl:col-span-2 space-y-6">

                        {/* Revenue Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gradient-to-br from-violet-900/40 to-fuchsia-900/40 backdrop-blur-md border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-violet-500/30 transition duration-500">
                                <div className="absolute top-0 right-0 p-20 bg-violet-500/10 blur-3xl rounded-full" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4 text-violet-300">
                                        <DollarSign className="w-5 h-5" />
                                        <span className="font-bold tracking-wider text-xs uppercase">Ingresos Brutos</span>
                                    </div>
                                    <h2 className="text-5xl font-black text-white tracking-tight mb-2">
                                        ${revenue.agencyRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </h2>
                                    <p className="text-xs text-violet-300/60 font-medium tracking-wide">TOTAL ACUMULADO</p>
                                </div>
                            </div>

                            <div className="bg-[#111]/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group hover:border-green-500/30 transition duration-500">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 mb-4 text-green-400">
                                        <Wallet className="w-5 h-5" />
                                        <span className="font-bold tracking-wider text-xs uppercase">Liquidez</span>
                                    </div>
                                    <p className="text-4xl font-black text-white">
                                        ${revenue.netAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-4">
                                        <div className="bg-green-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: '75%' }}></div>
                                    </div>
                                </div>
                                <button className="self-end mt-4 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold rounded-lg border border-green-500/20 transition">
                                    Gestionar Retiros &rarr;
                                </button>
                            </div>
                        </div>

                        {/* Main Chart */}
                        <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-1 shadow-2xl">
                            <RevenueChart data={analytics} />
                        </div>
                    </div>

                    {/* RIGHT COLUMN (1/3): Rankings & Activity */}
                    <div className="space-y-6">
                        {/* Top Creators Leaderboard */}
                        <div className="">
                            <TopCreators creators={godMode.topCreators} />
                        </div>

                        {/* Recent Activity Mini Feed */}
                        <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Live Log</h3>
                            <div className="space-y-4">
                                {recentLogs.map((log) => (
                                    <div key={log.id} className="flex gap-3 text-sm pb-3 border-b border-white/5 last:border-0 last:pb-0 group">
                                        <div className="mt-1 min-w-[6px] h-1.5 rounded-full bg-blue-500 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] transition" />
                                        <div>
                                            <p className="text-gray-300 font-medium group-hover:text-white transition">{log.action}</p>
                                            <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTTOM STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#111] border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition group">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider group-hover:text-gray-400 transition">Total Creadores</p>
                            <p className="text-2xl font-black text-white">{totalCreators}</p>
                        </div>
                        <Users className="w-8 h-8 text-gray-800 group-hover:text-gray-600 transition" />
                    </div>

                    <div className="bg-[#111] border border-green-500/10 p-5 rounded-2xl flex items-center justify-between hover:bg-green-900/10 transition group">
                        <div>
                            <p className="text-xs text-green-500/60 font-bold uppercase tracking-wider group-hover:text-green-400 transition">Activos</p>
                            <p className="text-2xl font-black text-green-400">{activeCreators}</p>
                        </div>
                        <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                    </div>

                    <div className="bg-[#111] border border-blue-500/10 p-5 rounded-2xl flex items-center justify-between hover:bg-blue-900/10 transition group">
                        <div>
                            <p className="text-xs text-blue-500/60 font-bold uppercase tracking-wider group-hover:text-blue-400 transition">Chats Activos</p>
                            <p className="text-2xl font-black text-blue-400">{activeChatsCount}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-blue-500/40 group-hover:text-blue-500 transition" />
                    </div>
                </div>
            </div>
        </div>
    )
}


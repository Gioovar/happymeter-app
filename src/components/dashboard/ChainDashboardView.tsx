'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useDashboard } from '@/context/DashboardContext'
import { useRouter } from 'next/navigation'
import { MapPin, ArrowRight, TrendingUp, Users, Star, Building2, Store } from 'lucide-react'
import LaserBorder from '@/components/ui/LaserBorder'
import { cn } from '@/lib/utils'

export default function ChainDashboardView() {
    const { chains, statsData, surveys, loadingAnalytics } = useDashboard()
    const router = useRouter()

    // Assuming first chain for now as UI only supports one chain currently
    const activeChain = chains[0]

    if (!activeChain) return null

    const allBranches = activeChain.branches
    const masterStats = statsData // Already aggregated by API

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {activeChain.name || 'Panel Maestro'}
                </h1>
                <p className="text-gray-400">
                    Visión global de todas tus sucursales y métricas consolidadas.
                </p>
            </div>

            {/* Global Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Respuestas"
                    value={masterStats.totalResponses}
                    icon={Users}
                    trend={masterStats.kpiChanges?.totalResponses}
                />
                <MetricCard
                    title="Promedio de Satisfacción"
                    value={masterStats.averageSatisfaction}
                    icon={Star}
                    trend={masterStats.kpiChanges?.averageSatisfaction}
                    isRating
                />
                <MetricCard
                    title="NPS Global"
                    value={masterStats.npsScore}
                    icon={TrendingUp}
                    trend={masterStats.kpiChanges?.npsScore}
                    isNps
                />
            </div>

            {/* Branch Grid */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-violet-500" />
                    Mis Sucursales
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Main Branch Card (The Owner) */}
                    <BranchCard
                        name="Sede Principal"
                        type="HEADQUARTERS"
                        surveysParams="" // No params = Global/Personal view effectively
                        onClick={() => router.push('/dashboard')}
                        isActive={!loadingAnalytics}
                    />

                    {/* Other Branches */}
                    {allBranches.map((branchItem) => (
                        <BranchCard
                            key={branchItem.id}
                            name={branchItem.name || branchItem.branch.businessName || 'Sucursal'}
                            type="BRANCH"
                            surveysParams={`?branchId=${branchItem.branchId}`}
                            onClick={() => router.push(`/dashboard?branchId=${branchItem.branchId}`)}
                            isActive={true}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

function MetricCard({ title, value, icon: Icon, trend, isRating, isNps }: any) {
    return (
        <div className="relative group p-6 rounded-3xl bg-[#0A0A0A] border border-white/5 overflow-hidden">
            <LaserBorder color="violet" maskClass="bg-[#0A0A0A]" />
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-3xl font-bold text-white">{value}</div>
                    {trend !== undefined && (
                        <div className={cn("text-xs font-medium mt-2 flex items-center gap-1",
                            trend > 0 ? "text-emerald-400" : trend < 0 ? "text-rose-400" : "text-gray-500"
                        )}>
                            {trend > 0 ? "+" : ""}{trend}% <span className="text-gray-600">vs mes anterior</span>
                        </div>
                    )}
                </div>
                <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-violet-500/10 transition-colors">
                    <Icon className="w-6 h-6 text-gray-400 group-hover:text-violet-400 transition-colors" />
                </div>
            </div>
        </div>
    )
}

function BranchCard({ name, type, onClick, isActive, surveysParams }: any) {
    return (
        <button
            onClick={onClick}
            className="group relative p-6 rounded-3xl bg-[#0F0F0F] border border-white/5 hover:border-violet-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/10 text-left w-full h-full flex flex-col justify-between overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 group-hover:border-violet-500/30 transition-colors">
                        {type === 'HEADQUARTERS' ? (
                            <Building2 className="w-6 h-6 text-gray-300 group-hover:text-violet-300" />
                        ) : (
                            <MapPin className="w-6 h-6 text-gray-300 group-hover:text-violet-300" />
                        )}
                    </div>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-violet-200 transition-colors mb-1">
                    {name}
                </h3>
                <p className="text-sm text-gray-500">
                    {type === 'HEADQUARTERS' ? 'Gestión Central' : 'Sucursal Operativa'}
                </p>
            </div>

            <div className="relative z-10 mt-6 flex items-center gap-2 text-sm font-medium text-violet-400 group-hover:translate-x-1 transition-transform">
                Entrar al Dashboard <ArrowRight className="w-4 h-4" />
            </div>
        </button>
    )
}


import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import { Loader2, Brain, Zap, Server, Activity } from 'lucide-react'
import { subDays, format } from 'date-fns'
import { getGlobalAnalytics } from '@/actions/admin'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
    const analytics = await getGlobalAnalytics()
    const totalTokens = analytics.tokens.reduce((a, b) => a + b.value, 0)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Global Analytics</h1>
                <p className="text-gray-400 mt-1">Métricas de rendimiento y consumo de recursos.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Brain className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Total AI Tokens</p>
                        <p className="text-2xl font-bold text-white">{(totalTokens / 1000).toFixed(1)}K</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                        <Zap className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Encuestas Activas</p>
                        <p className="text-2xl font-bold text-white">{analytics.metrics.activeSurveys}</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                        <Activity className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Respuestas Totales</p>
                        <p className="text-2xl font-bold text-white">{analytics.metrics.totalResponses}</p>
                    </div>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            }>
                <AnalyticsCharts data={{ growth: analytics.last30Days, tokens: analytics.tokens }} />
            </Suspense>
        </div>
    )
}

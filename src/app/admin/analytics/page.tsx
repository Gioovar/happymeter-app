
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import AnalyticsCharts from '@/components/admin/AnalyticsCharts'
import { Loader2, Brain, Zap, Server } from 'lucide-react'
import { subDays, format } from 'date-fns'

export const dynamic = 'force-dynamic'

async function getAnalyticsData() {
    // Mocking historical data because we don't have a daily timeseries table yet
    // In a real app, we would query a 'DailyStats' table or aggregate by createdAt

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i)
        return {
            date: format(date, 'MMM dd'),
            users: Math.floor(Math.random() * 50) + 10 * i, // Simulated cumulative growth
            responses: Math.floor(Math.random() * 200) + 50 * i
        }
    })

    const tokens = [
        { name: 'GPT-4o', value: 45000 },
        { name: 'GPT-3.5', value: 120000 },
        { name: 'Embedding', value: 85000 },
    ]

    return { last7Days, tokens }
}

export default async function AdminAnalyticsPage() {
    const data = await getAnalyticsData()

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
                        <p className="text-2xl font-bold text-white">250K</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                        <Zap className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Latencia Media</p>
                        <p className="text-2xl font-bold text-white">240ms</p>
                    </div>
                </div>
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl">
                        <Server className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Error Rate</p>
                        <p className="text-2xl font-bold text-white">0.2%</p>
                    </div>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            }>
                <AnalyticsCharts data={data} />
            </Suspense>
        </div>
    )
}

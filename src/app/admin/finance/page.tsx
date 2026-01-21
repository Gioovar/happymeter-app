import { getFinancialStats, getDetailedFinancials } from '@/actions/admin-dashboard'
import { DollarSign, TrendingDown, Users, CreditCard, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminFinancePage() {
    const [basicStats, detailedStats] = await Promise.all([
        getFinancialStats(),
        getDetailedFinancials()
    ])

    const cards = [
        {
            label: 'MRR (Ingreso Mensual Recurrente)',
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(basicStats.mrr),
            subValue: 'Base para ARR',
            icon: DollarSign,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            border: 'border-green-500/20'
        },
        {
            label: 'ARR (Anualizado)',
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(basicStats.arr),
            subValue: 'Proyección anual',
            icon: Activity,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            label: 'Tasa de Cancelación (Churn)',
            value: `${detailedStats.churnRate.toFixed(1)}%`,
            subValue: `${detailedStats.canceledCount} usuarios cancelados`,
            icon: TrendingDown,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/20'
        },
        {
            label: 'Suscripciones Activas',
            value: basicStats.activeSubscribers,
            subValue: 'Usuarios pagando actualmente',
            icon: CreditCard,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20'
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold text-white">Finanzas & Suscripciones</h1>
                    <p className="text-gray-400">Métricas de ingresos, planes y retención.</p>
                </div>
                {/* <button className="px-4 py-2 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition">
                    Exportar Reporte
                </button> */}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl bg-[#0F0F0F] border ${card.border} hover:border-white/20 transition-all`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${card.bg}`}>
                                <card.icon className={`w-5 h-5 ${card.color}`} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-white mb-1 tracking-tight">{card.value}</h3>
                            <p className="text-sm text-gray-400 font-medium mb-1">{card.label}</p>
                            <p className="text-xs text-gray-500">{card.subValue}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Plan Distribution */}
                <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6">Distribución de Ingresos por Plan</h3>
                    <div className="space-y-4">
                        {Object.entries(basicStats.planBreakdown).map(([plan, count]) => (
                            <div key={plan} className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-300 capitalize">{plan.toLowerCase().replace('_', ' ')}</span>
                                    <span className="text-sm font-bold text-white">{count} usuarios</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 group-hover:bg-blue-400 transition-all rounded-full"
                                        style={{ width: `${(count / basicStats.activeSubscribers) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Subscribers */}
                <div className="p-6 rounded-3xl bg-[#0F0F0F] border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-6">Suscriptores Recientes</h3>
                    <div className="space-y-4">
                        {detailedStats.recentSubscribers.length === 0 ? (
                            <p className="text-gray-500 text-sm">No hay actividad reciente.</p>
                        ) : (
                            detailedStats.recentSubscribers.map((sub: any) => (
                                <div key={sub.userId} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-white/5">
                                            <Users className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{sub.businessName || 'Sin nombre'}</p>
                                            <p className="text-xs text-gray-500">{new Date(sub.updatedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                                            {sub.plan}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/5 text-center">
                        <Link href="/admin/users" className="text-sm text-gray-400 hover:text-white transition">
                            Ver todos los usuarios &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

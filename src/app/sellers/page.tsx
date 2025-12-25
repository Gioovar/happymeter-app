import { getSellerDashboardData } from '@/actions/sellers'
import { DollarSign, MapPin, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function SellerDashboardPage() {
    const data = await getSellerDashboardData()
    if (!data) return <div className="text-white">Profile not found.</div>

    const { profile, stats } = data

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Hola, Representante</h1>
                <p className="text-gray-400">
                    Aquí está el resumen de tu territorio:{' '}
                    <span className="text-blue-400 font-medium">{profile.state}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-6 bg-[#111] border border-white/10 rounded-2xl text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Ganancias Mes</p>
                            <p className="text-2xl font-bold">
                                ${stats.monthlyEarnings.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#111] border border-white/10 rounded-2xl text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Balance Total</p>
                            <p className="text-2xl font-bold">${stats.balance.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#111] border border-white/10 rounded-2xl text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Negocios Totales</p>
                            <p className="text-2xl font-bold">{stats.totalBusinesses}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#111] border border-white/10 rounded-2xl text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Suscripciones Activas</p>
                            <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Commissions Table Preview */}
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white">Comisiones Recientes</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 text-left text-xs text-gray-400 uppercase">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Descripción</th>
                                <th className="px-6 py-4">Monto</th>
                                <th className="px-6 py-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {profile.commissions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-8 text-center text-gray-500"
                                    >
                                        No hay comisiones recientes
                                    </td>
                                </tr>
                            ) : (
                                profile.commissions.map((comm) => (
                                    <tr key={comm.id} className="text-sm text-gray-300">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(comm.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">{comm.description}</td>
                                        <td className="px-6 py-4 font-medium text-emerald-400">
                                            +${comm.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={cn(
                                                    'px-2 py-1 rounded-full text-xs font-medium',
                                                    comm.status === 'PAID'
                                                        ? 'bg-emerald-500/10 text-emerald-500'
                                                        : 'bg-yellow-500/10 text-yellow-500'
                                                )}
                                            >
                                                {comm.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

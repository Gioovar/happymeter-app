import { getSellerTransactions } from '@/actions/sellers'
import { cn } from '@/lib/utils'

export default async function EarningsPage() {
    const profile = await getSellerTransactions()
    if (!profile) return <div>Cargando...</div>

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">Finanzas</h1>
                <p className="text-gray-400">
                    Balance Disponible:{' '}
                    <span className="text-emerald-400 font-bold text-xl">
                        ${profile.balance.toFixed(2)}
                    </span>
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Commissions */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Historial de Comisiones</h2>
                    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full">
                                <thead className="bg-white/5 text-left text-xs text-gray-400 uppercase sticky top-0 bg-[#111]">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Monto</th>
                                        <th className="px-6 py-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {profile.commissions.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-6 py-4 text-center text-gray-500"
                                            >
                                                Sin comisiones
                                            </td>
                                        </tr>
                                    ) : (
                                        profile.commissions.map((c) => (
                                            <tr key={c.id} className="text-sm text-gray-300">
                                                <td className="px-6 py-4">
                                                    {new Date(c.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-emerald-400 font-medium">
                                                    +${c.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            'px-2 py-1 rounded-full text-xs font-medium',
                                                            c.status === 'PAID'
                                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                                : 'bg-yellow-500/10 text-yellow-500'
                                                        )}
                                                    >
                                                        {c.status}
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

                {/* Payouts */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Retiros y Pagos</h2>
                    <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto max-h-[600px]">
                            <table className="w-full">
                                <thead className="bg-white/5 text-left text-xs text-gray-400 uppercase sticky top-0 bg-[#111]">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Monto</th>
                                        <th className="px-6 py-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {profile.payouts.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-6 py-4 text-center text-gray-500"
                                            >
                                                Sin retiros
                                            </td>
                                        </tr>
                                    ) : (
                                        profile.payouts.map((p) => (
                                            <tr key={p.id} className="text-sm text-gray-300">
                                                <td className="px-6 py-4">
                                                    {new Date(p.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-white font-medium">
                                                    -${p.amount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            'px-2 py-1 rounded-full text-xs font-medium',
                                                            p.status === 'PAID'
                                                                ? 'bg-emerald-500/10 text-emerald-500'
                                                                : 'bg-gray-500/10 text-gray-500'
                                                        )}
                                                    >
                                                        {p.status}
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
            </div>
        </div>
    )
}

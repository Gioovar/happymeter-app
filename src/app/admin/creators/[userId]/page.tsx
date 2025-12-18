import { Suspense } from 'react'
import { getCreator } from '@/actions/admin'
import { getChatAttributes } from '@/actions/chat'
import { auth } from '@clerk/nextjs/server'
import { format } from 'date-fns'
import {
    CheckCircle, XCircle, DollarSign, Users, Award,
    TrendingUp, Calendar, CreditCard, ExternalLink,
    ArrowUpRight, AlertCircle
} from 'lucide-react'
import ImpersonateButton from '@/components/admin/ImpersonateButton'
import AdminChatWindow from '@/components/admin/AdminChatWindow'
import CommissionEditor from '@/components/admin/CommissionEditor'

export const dynamic = 'force-dynamic'

export default async function CreatorDetailPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params
    const { userId: currentAdminId } = await auth()

    // Parallel fetching
    const [creator, chat] = await Promise.all([
        getCreator(userId),
        getChatAttributes(userId).catch(() => null)
    ])

    if (!creator) {
        return <div className="p-12 text-center text-gray-500">Creador no encontrado</div>
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Card */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-violet-500/5 blur-3xl rounded-full pointer-events-none" />

                <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-900/20">
                        <span className="text-3xl font-bold text-white">{creator.code.substring(0, 2).toUpperCase()}</span>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-white tracking-tight">{creator.code}</h1>
                            {(creator as any).status === 'ACTIVE' ? (
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> ACTIVO
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> SUSPENDIDO
                                </span>
                            )}
                        </div>
                        <p className="text-gray-400 font-mono mb-6">{creator.userId}</p>

                        <div className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Calendar className="w-4 h-4 text-violet-500" />
                                Registrado: {format(creator.createdAt, 'dd MMM yyyy')}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <CreditCard className="w-4 h-4 text-violet-500" />
                                PayPal: {creator.paypalEmail || 'No configurado'}
                            </div>
                        </div>
                    </div>

                    {/* Quick Action / Balance Box */}
                    <div className="flex flex-col gap-6 text-right">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 min-w-[250px]">
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">Saldo Pendiente</p>
                            <p className="text-3xl font-bold text-white mb-4">${creator.balance.toFixed(2)}</p>

                            <div className="flex gap-2 justify-end flex-wrap">
                                <ImpersonateButton userId={creator.userId} name={creator.code} type="creator" />
                                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition">
                                    Ajustar
                                </button>
                                <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-green-900/20">
                                    Pagar
                                </button>
                            </div>
                        </div>

                        {/* Commission Rate Editor */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex justify-end">
                            <CommissionEditor
                                creatorId={creator.userId}
                                currentRate={(creator as any).commissionRate || 0}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-violet-500/10 rounded-lg text-violet-500">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">GLOBAL</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Ventas Generadas</p>
                    <p className="text-2xl font-bold text-white">${creator.stats.totalSalesAmount.toFixed(2)}</p>
                </div>

                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Referidos Totales</p>
                    <p className="text-2xl font-bold text-white">{creator.stats.totalReferrals}</p>
                </div>

                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                            <Award className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">
                            {((creator.stats.activeReferrals / (creator.stats.totalReferrals || 1)) * 100).toFixed(0)}% Conv.
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Referidos Activos</p>
                    <p className="text-2xl font-bold text-white">{creator.stats.activeReferrals}</p>
                </div>

                <div className="bg-[#111] border border-white/10 p-6 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">Comisión Pagada</p>
                    <p className="text-2xl font-bold text-white">${creator.stats.commissionPaid.toFixed(2)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chat Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Qualification Data Card */}
                    <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400">
                                <Award className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-white">Datos del Creador</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Nicho</p>
                                <div className="inline-block px-2 py-1 bg-white/5 rounded text-sm text-gray-200 border border-white/10">
                                    {(creator as any).niche || 'No especificado'}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Audiencia</p>
                                <p className="text-white">{(creator as any).audienceSize || '?'}</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Instagram</p>
                                    <p className="font-medium">{creator.instagram || '-'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">TikTok</p>
                                    <p className="font-medium">{creator.tiktok || '-'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">YouTube</p>
                                    <p className="font-medium">{creator.youtube || '-'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">Facebook</p>
                                    <p className="font-medium">{creator.facebook || '-'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                                    <p className="font-medium text-green-600">{creator.whatsapp || '-'}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                                    <p className="text-xs text-gray-500 mb-1">Otras Redes</p>
                                    <p className="font-medium truncate" title={creator.otherSocials || ''}>
                                        {creator.otherSocials || '-'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Estrategia</p>
                                <p className="text-sm text-gray-400 italic bg-black/30 p-3 rounded-lg border border-white/5">
                                    "{(creator as any).contentStrategy || 'Sin estrategia definida'}"
                                </p>
                            </div>
                        </div>
                    </div>

                    <AdminChatWindow
                        creatorId={creator.userId}
                        currentUserId={currentAdminId!}
                        initialMessages={chat?.messages || []}
                    />
                </div>

                {/* Referrals & Sales */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Referrals List */}
                    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Últimos Referidos</h3>
                            <span className="text-xs text-gray-500">{creator.referrals.length} total</span>
                        </div>
                        <div className="flex-1 overflow-auto max-h-[400px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-gray-400 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Usuario</th>
                                        <th className="px-6 py-3">Estado</th>
                                        <th className="px-6 py-3 text-right">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {creator.referrals.map(referral => (
                                        <tr key={referral.id} className="hover:bg-white/5">
                                            <td className="px-6 py-3 text-white font-mono text-xs">
                                                {referral.referredUserId.substring(0, 12)}...
                                            </td>
                                            <td className="px-6 py-3">
                                                {referral.status === 'CONVERTED' ? (
                                                    <span className="text-green-400 text-xs font-bold">Activo</span>
                                                ) : (
                                                    <span className="text-gray-500 text-xs">Registrado</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-500">
                                                {format(referral.createdAt, 'dd/MM/yy')}
                                            </td>
                                        </tr>
                                    ))}
                                    {creator.referrals.length === 0 && (
                                        <tr><td colSpan={3} className="p-6 text-center text-gray-500">Sin referidos</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sales History */}
                    <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white">Historial de Ventas (Atribuidas)</h3>
                            <span className="text-xs text-gray-500">${creator.stats.totalSalesAmount.toFixed(2)} total</span>
                        </div>
                        <div className="flex-1 overflow-auto max-h-[400px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-gray-400 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Monto</th>
                                        <th className="px-6 py-3">Cliente ID</th>
                                        <th className="px-6 py-3 text-right">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {creator.salesHistory?.map(sale => (
                                        <tr key={sale.id} className="hover:bg-white/5">
                                            <td className="px-6 py-3 text-white font-bold">
                                                ${sale.amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                                                {sale.userId.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-3 text-right text-gray-500">
                                                {format(sale.createdAt, 'dd/MM/yy')}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!creator.salesHistory || creator.salesHistory.length === 0) && (
                                        <tr><td colSpan={3} className="p-6 text-center text-gray-500">Sin ventas registradas</td></tr>
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

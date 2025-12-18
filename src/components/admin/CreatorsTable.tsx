'use client'

import { DollarSign, Users, Award, ExternalLink } from 'lucide-react'

interface Creator {
    id: string
    userId: string
    code: string
    balance: number
    paypalEmail: string | null
    createdAt: Date
    _count: {
        referrals: number
        commissions: number
    }
}

export default function CreatorsTable({ creators }: { creators: Creator[] }) {
    return (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-3">Código</th>
                            <th className="px-6 py-3">Usuario (ID)</th>
                            <th className="px-6 py-3">Saldo</th>
                            <th className="px-6 py-3 text-center">Referidos</th>
                            <th className="px-6 py-3 text-center">Ventas</th>
                            <th className="px-6 py-3">PayPal</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {creators.map((creator) => (
                            <tr key={creator.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-amber-500" />
                                        <span className="font-bold text-white tracking-wider">{creator.code}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                                    {creator.userId}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-green-400 font-bold flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        {creator.balance.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center text-gray-300">
                                    <div className="flex items-center justify-center gap-1">
                                        <Users className="w-3 h-3 text-blue-400" />
                                        {creator._count.referrals}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center text-gray-300">
                                    {creator._count.commissions}
                                </td>
                                <td className="px-6 py-4 text-gray-400 text-xs">
                                    {creator.paypalEmail || '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {creators.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    No hay creadores registrados aún.
                </div>
            )}
        </div>
    )
}

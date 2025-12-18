'use client'

import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Subscription {
    userId: string
    businessName: string | null
    plan: string
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    subscriptionStatus: string | null
    subscriptionPeriodEnd: Date | null
    createdAt: Date
}

export default function SubscriptionsTable({ subscriptions }: { subscriptions: Subscription[] }) {

    const getStatusBadge = (status: string | null) => {
        if (!status) return <span className="text-gray-500 text-xs">Manual / Unknown</span>

        switch (status) {
            case 'active':
                return <span className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" /> Active</span>
            case 'trialing':
                return <span className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full text-xs font-bold"><Clock className="w-3 h-3" /> Trial</span>
            case 'past_due':
                return <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full text-xs font-bold"><AlertCircle className="w-3 h-3" /> Past Due</span>
            case 'canceled':
                return <span className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-full text-xs font-bold"><XCircle className="w-3 h-3" /> Canceled</span>
            default:
                return <span className="text-gray-400 text-xs">{status}</span>
        }
    }

    return (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Plan</th>
                            <th className="px-6 py-3">Estado Stripe</th>
                            <th className="px-6 py-3">Renovación</th>
                            <th className="px-6 py-3">Customer ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {subscriptions.map((sub) => (
                            <tr key={sub.userId} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white max-w-[200px] truncate">
                                            {sub.businessName || 'Sin Nombre'}
                                        </span>
                                        <span className="text-xs text-gray-500 font-mono">
                                            {sub.userId.substring(0, 8)}...
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "font-bold text-xs",
                                        sub.plan === 'FREE' && "text-gray-400",
                                        sub.plan !== 'FREE' && "text-violet-400"
                                    )}>
                                        {sub.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(sub.subscriptionStatus)}
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {sub.subscriptionPeriodEnd
                                        ? sub.subscriptionPeriodEnd.toLocaleDateString()
                                        : '-'
                                    }
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                                    {sub.stripeCustomerId || 'N/A'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {subscriptions.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    No hay suscripciones activas (excepto Free manuales).
                </div>
            )}
        </div>
    )
}

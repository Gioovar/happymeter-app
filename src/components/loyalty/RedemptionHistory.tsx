"use client"

import { useState, useEffect } from "react"
import { getProgramRedemptions } from "@/actions/loyalty"
import { Loader2, Gift, User, ShieldCheck } from "lucide-react"

interface RedemptionHistoryProps {
    programId: string
}

export function RedemptionHistory({ programId }: RedemptionHistoryProps) {
    const [redemptions, setRedemptions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        getProgramRedemptions(programId)
            .then(data => {
                if (Array.isArray(data)) {
                    setRedemptions(data)
                } else {
                    console.error("Data received is not an array:", data)
                    setRedemptions([]) // Fallback to empty
                }
                setLoading(false)
            })
            .catch(err => {
                console.error("Failed to load history:", err)
                setError("No se pudo cargar el historial. Intenta recargar.")
                setLoading(false)
            })
    }, [programId])

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6 text-center border border-red-500/20 bg-red-500/10 rounded-xl text-red-400">
                <p>{error}</p>
            </div>
        )
    }

    if (!redemptions || redemptions.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl bg-white/5">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                    <Gift className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-medium text-gray-400">Sin canjes recientes</h4>
                <p className="text-sm text-gray-600">El historial de premios entregados aparecerá aquí.</p>
            </div>
        )
    }

    // Group by Date
    const groupedRedemptions = redemptions.reduce((acc: any, r: any) => {
        const date = new Date(r.redeemedAt)
        const dateKey = date.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(r)
        return acc
    }, {})

    return (
        <div className="space-y-8 relative">
            {Object.keys(groupedRedemptions).map((dateKey) => (
                <div key={dateKey} className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                        {dateKey.charAt(0).toUpperCase() + dateKey.slice(1)} <span className="text-gray-600">({groupedRedemptions[dateKey].length})</span>
                    </h3>

                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#16161e]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-gray-400 font-medium">
                                    <tr>
                                        <th className="p-4 w-1/3">Premio</th>
                                        <th className="p-4 w-1/3">Cliente</th>
                                        <th className="p-4 w-1/4">Entregado Por</th>
                                        <th className="p-4 text-right">Hora</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {groupedRedemptions[dateKey].map((redemption: any) => (
                                        <tr key={redemption.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                                        <Gift className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-gray-200">{redemption.reward?.name || "Premio Eliminado"}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4 text-gray-500" />
                                                    <span className="text-gray-300">
                                                        {redemption.customer?.name || redemption.customer?.phone || "Cliente"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-violet-500" />
                                                    <span className="font-medium text-violet-300">
                                                        {redemption.staffName}
                                                        {redemption.staffDetails?.jobTitle && redemption.staffDetails.jobTitle !== 'Staff' && (
                                                            <span className="text-violet-500/50 text-xs ml-1">
                                                                ({redemption.staffDetails.jobTitle})
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right text-gray-500 font-mono text-xs">
                                                {new Date(redemption.redeemedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

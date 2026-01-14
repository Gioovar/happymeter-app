"use client"

import { useState, useEffect } from "react"
import { getProgramRedemptions } from "@/actions/loyalty"
import { Loader2, Gift, User, Clock, ShieldCheck, Mail, Phone, Briefcase, X } from "lucide-react"
import Image from "next/image"

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

    const [selectedStaff, setSelectedStaff] = useState<any | null>(null)

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
                                                <button
                                                    onClick={() => setSelectedStaff(redemption.staffDetails)}
                                                    className="flex items-center gap-2 hover:bg-white/10 p-1.5 rounded-lg transition-colors group text-left"
                                                    disabled={!redemption.staffDetails}
                                                >
                                                    {redemption.staffDetails?.photoUrl ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={redemption.staffDetails.photoUrl}
                                                            alt={redemption.staffDetails.name}
                                                            className="w-6 h-6 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                                                            <ShieldCheck className="w-3 h-3 text-violet-500" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-violet-300 group-hover:text-violet-200 group-hover:underline decoration-violet-500/30 underline-offset-4 transition-all">
                                                        {redemption.staffDetails?.name || redemption.staffName}
                                                    </span>
                                                </button>
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

            {/* Staff Profile Modal */}
            {selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedStaff(null)}
                    />
                    <div className="relative z-10 w-full max-w-sm bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header Background */}
                        <div className="h-24 bg-gradient-to-r from-violet-600 to-fuchsia-600 relative">
                            <button
                                onClick={() => setSelectedStaff(null)}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Profile Info */}
                        <div className="px-6 pb-6 -mt-10">
                            <div className="relative inline-block">
                                {selectedStaff.photoUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={selectedStaff.photoUrl}
                                        alt={selectedStaff.name}
                                        className="w-20 h-20 rounded-full border-4 border-[#1a1a24] object-cover bg-[#1a1a24]"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full border-4 border-[#1a1a24] bg-violet-900 flex items-center justify-center text-violet-200">
                                        <User className="w-10 h-10" />
                                    </div>
                                )}
                                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-[#1a1a24] rounded-full" />
                            </div>

                            <div className="mt-3">
                                <h3 className="text-lg font-bold text-white">{selectedStaff.name}</h3>
                                <p className="text-sm text-violet-400 font-medium flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {selectedStaff.jobTitle || "Staff"}
                                </p>
                            </div>

                            <div className="mt-6 space-y-3 bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">Correo Electrónico</span>
                                        <span className="text-gray-200 truncate max-w-[200px]">{selectedStaff.email || "No registrado"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">Teléfono</span>
                                        <span className="text-gray-200">{selectedStaff.phone || "No registrado"}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500">ID de Sistema</span>
                                        <span className="text-gray-200 font-mono text-[10px]">{selectedStaff.id.slice(0, 12)}...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

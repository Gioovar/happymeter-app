'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, DollarSign, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner' // Assuming existing toast lib, or simple alert

interface Commission {
    id: string
    amount: number
    description: string
    status: 'PENDING' | 'PAID'
    createdAt: string
    affiliate: {
        code: string
        paypalEmail: string
        stripeConnectId: string | null
    }
}

export default function PayoutsTable() {
    const [commissions, setCommissions] = useState<Commission[]>([])
    const [loading, setLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    useEffect(() => {
        fetchCommissions()
    }, [])

    const fetchCommissions = async () => {
        try {
            // We need an endpoint to list commissions. 
            // I'll assume we can filter /api/admin/stats or create a dedicated getter.
            // For now, let's create a server action or use a new GET route.
            // Better to make a quick GET endpoint in /api/admin/payouts as well.
            const res = await fetch('/api/admin/payouts')
            if (res.ok) {
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const data = await res.json()
                    setCommissions(data.commissions || [])
                } else {
                    console.error("Received non-JSON response from /api/admin/payouts")
                }
            } else {
                console.error("Failed to fetch payouts:", res.status, res.statusText)
            }
        } catch (error) {
            console.error('Failed to load commissions', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePayout = async (commission: Commission) => {
        if (!commission.affiliate.stripeConnectId) {
            toast.error('Este creador no tiene cuenta Stripe conectada')
            return
        }

        if (!confirm(`¿Confirmar pago de $${commission.amount} a ${commission.affiliate.code}?`)) return

        setProcessingId(commission.id)
        try {
            const res = await fetch('/api/admin/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ commissionId: commission.id })
            })

            if (!res.ok) {
                const err = await res.text()
                throw new Error(err)
            }

            toast.success('Pago enviado correctamente')
            fetchCommissions() // Refresh
        } catch (error: any) {
            toast.error(`Error de pago: ${error.message}`)
        } finally {
            setProcessingId(null)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-400">Cargando comisiones...</div>

    return (
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    Pagos Pendientes
                </h3>
                <span className="text-xs text-gray-500">Solo Super Admin</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-500 uppercase bg-white/5">
                        <tr>
                            <th className="px-6 py-3">Creador</th>
                            <th className="px-6 py-3">Concepto</th>
                            <th className="px-6 py-3">Monto</th>
                            <th className="px-6 py-3">Estado Stripe</th>
                            <th className="px-6 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {commissions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No hay comisiones pendientes
                                </td>
                            </tr>
                        ) : (
                            commissions.map((comm) => (
                                <tr key={comm.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                                            <User className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <div>{comm.affiliate.code}</div>
                                            <div className="text-xs text-gray-500">{comm.affiliate.paypalEmail}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{comm.description}</td>
                                    <td className="px-6 py-4 font-bold text-green-400">
                                        ${comm.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {comm.affiliate.stripeConnectId ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                                                <Check className="w-3 h-3" /> Conectado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs">
                                                <AlertCircle className="w-3 h-3" /> Sin Cuenta
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {comm.status === 'PAID' ? (
                                            <span className="text-green-500 font-bold text-xs">PAGADO</span>
                                        ) : (
                                            <button
                                                onClick={() => handlePayout(comm)}
                                                disabled={!comm.affiliate.stripeConnectId || processingId === comm.id}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 ml-auto"
                                            >
                                                {processingId === comm.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Pagar'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

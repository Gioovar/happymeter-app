'use client'

import { useState, useEffect } from 'react'
import { createStripeConnectAccount, getStripeAccountStatus } from '@/actions/payments-onboarding'
import { getMyPayouts } from '@/actions/creators'
import { Loader2, AlertCircle, CheckCircle2, CreditCard, Wallet, History, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import PayoutReceiptButton from '@/components/creators/PayoutReceiptButton'

export default function CreatorPaymentsPage() {
    const [status, setStatus] = useState<any>(null)
    const [payouts, setPayouts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [connecting, setConnecting] = useState(false)
    const router = useRouter()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [statusData, payoutsData] = await Promise.all([
                getStripeAccountStatus(),
                getMyPayouts()
            ])
            setStatus(statusData)
            setPayouts(payoutsData)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async () => {
        setConnecting(true)
        try {
            const url = await createStripeConnectAccount()
            if (url) {
                window.location.href = url
            } else {
                toast.error('No se pudo generar el enlace')
            }
        } catch (error) {
            toast.error('Error al conectar con Stripe')
            setConnecting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    const isConnected = status?.connected && status?.payoutsEnabled

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                        Configuración de Pagos
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Gestiona cómo recibes tus comisiones y descarga tus comprobantes.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Balance Card */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-center gap-3 text-purple-400">
                        <Wallet className="w-6 h-6" />
                        <h2 className="font-bold">Tu Saldo Actual</h2>
                    </div>
                    {/* Note: In a real app we'd fetch balance here */}
                    <div className="text-3xl font-bold text-white">
                        Consultar en Dashboard
                    </div>
                    <p className="text-xs text-gray-500">
                        Los pagos se procesan automáticamente los días de corte.
                    </p>
                </div>

                {/* Stripe Connection Card */}
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                    <div className="flex items-center gap-3 text-blue-400">
                        <CreditCard className="w-6 h-6" />
                        <h2 className="font-bold">Cuenta Bancaria (Stripe)</h2>
                    </div>

                    {isConnected ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-green-400 text-sm">Cuenta Conectada Exitósamente</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Tu cuenta está lista para recibir transferencias.
                                    </p>
                                    <p className="text-[10px] font-mono text-gray-500 mt-2">ID: {status.accountId}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleConnect}
                                disabled={connecting}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
                            >
                                {connecting ? 'Cargando...' : 'Cambiar Cuenta / Actualizar Datos'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-yellow-400 text-sm">Configuración Pendiente</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Necesitas conectar tu cuenta bancaria a través de Stripe para recibir tus pagos.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleConnect}
                                disabled={connecting}
                                className="w-full py-3 bg-[#635BFF] hover:bg-[#5349E0] text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#635BFF]/20"
                            >
                                {connecting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        <span>Conectar con Stripe</span>
                                        <ExternalLinkIcon />
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-gray-500">
                                Serás redirigido a Stripe para completar tu información bancaria de forma segura.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payout History Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white border-t border-white/10 pt-8">
                    <History className="w-5 h-5 text-purple-400" /> Historial de Pagos
                </h2>

                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    {payouts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No has recibido ningún pago todavía.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-black/20">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">ID Transacción</th>
                                        <th className="px-6 py-4">Monto</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Comprobante</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {payouts.map((payout) => (
                                        <tr key={payout.id} className="hover:bg-white/5 transition">
                                            <td className="px-6 py-4 font-mono text-gray-300">
                                                {new Date(payout.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                {payout.id.slice(0, 8).toUpperCase()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-green-400">
                                                ${payout.amount.toFixed(2)} USD
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-xs font-bold",
                                                    payout.status.includes('STRIPE') ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-500"
                                                )}>
                                                    {payout.status === 'COMPLETED' ? 'PAGADO' : payout.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <PayoutReceiptButton
                                                    payout={payout}
                                                    creatorName="Yo (Creador)"
                                                    variant="full"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ExternalLinkIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCreatorDetails, processPayout, createAdjustment } from '@/actions/staff-payments'
import { Loader2, DollarSign, MessageSquare, Briefcase, Instagram, Facebook, LayoutDashboard, History, AlertTriangle, Send } from 'lucide-react'
import PayoutReceiptButton from '@/components/creators/PayoutReceiptButton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CreatorDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    creatorId: string | null
}

export default function CreatorDetailsModal({ isOpen, onClose, creatorId }: CreatorDetailsModalProps) {
    const [creator, setCreator] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Action States
    const [showPayoutForm, setShowPayoutForm] = useState(false)
    const [payoutAmount, setPayoutAmount] = useState('')
    const [payoutMessage, setPayoutMessage] = useState('')
    const [processingPayout, setProcessingPayout] = useState(false)

    const [showPenaltyForm, setShowPenaltyForm] = useState(false)
    const [penaltyAmount, setPenaltyAmount] = useState('')
    const [penaltyReason, setPenaltyReason] = useState('')
    const [processingPenalty, setProcessingPenalty] = useState(false)

    // Tab State
    const [activeTab, setActiveTab] = useState("overview")

    useEffect(() => {
        if (isOpen && creatorId) {
            loadDetails()
            resetForms()
            setActiveTab("overview") // Reset to overview on open
        } else {
            setCreator(null)
        }
    }, [isOpen, creatorId])

    const resetForms = () => {
        setShowPayoutForm(false)
        setShowPenaltyForm(false)
        setPayoutAmount('')
        setPayoutMessage('')
        setPenaltyAmount('')
        setPenaltyReason('')
    }

    const loadDetails = async () => {
        if (!creatorId) return
        setLoading(true)
        try {
            const data = await getCreatorDetails(creatorId)
            setCreator(data)
            // Pre-fill full balance
            setPayoutAmount(data.balance.toString())
        } catch (error) {
            toast.error('Error cargando detalles')
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const handlePayout = async () => {
        if (!creator) return
        const amount = parseFloat(payoutAmount)
        if (isNaN(amount) || amount <= 0 || amount > creator.balance) {
            toast.error('Monto inválido')
            return
        }

        const confirm = window.confirm(`¿Confirmas procesar el pago de $${amount.toFixed(2)}? ${creator.stripeConnectId ? '(Vía Stripe)' : '(MANUAL)'}`)
        if (!confirm) return

        setProcessingPayout(true)
        try {
            const result = await processPayout(creator.id, amount, payoutMessage)
            if (result.method === 'STRIPE') {
                toast.success('Pago enviado vía Stripe Connect 💸')
            } else {
                toast.success('Pago manual registrado ✅')
            }
            loadDetails()
            resetForms()
        } catch (error) {
            toast.error('Error al procesar el pago: ' + (error as any).message)
        } finally {
            setProcessingPayout(false)
        }
    }

    const handlePenalty = async () => {
        if (!creator) return
        const amount = parseFloat(penaltyAmount)
        if (isNaN(amount) || amount <= 0) {
            toast.error('Monto inválido')
            return
        }
        if (!penaltyReason.trim()) {
            toast.error('Debes indicar el motivo')
            return
        }

        setProcessingPenalty(true)
        try {
            await createAdjustment(creator.id, amount, penaltyReason)
            toast.success('Ajuste aplicado correctamente')
            loadDetails()
            resetForms()
        } catch (error) {
            toast.error('Error al aplicar ajuste')
        } finally {
            setProcessingPenalty(false)
        }
    }

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#111] border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Detalles del Creador</DialogTitle>
                </DialogHeader>

                {loading || !creator ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Header Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 relative overflow-hidden flex flex-col justify-between">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase font-bold">Saldo Disponible</p>
                                    <div className="mt-1">
                                        <span className="text-3xl font-bold text-green-400 block">${creator.balance.toFixed(2)}</span>
                                        {creator.stripeConnectId ? (
                                            <span className="text-[10px] text-blue-400 flex items-center gap-1 bg-blue-500/10 w-fit px-2 py-0.5 rounded mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Stripe Conectado
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Pago Manual
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveTab('financial')}
                                    className="text-xs text-violet-400 hover:text-violet-300 transition text-left mt-2 flex items-center gap-1 font-bold"
                                >
                                    <History className="w-3 h-3" /> Ver Historial
                                </button>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        setShowPayoutForm(!showPayoutForm)
                                        setShowPenaltyForm(false)
                                    }}
                                    disabled={creator.balance <= 0}
                                    className={cn(
                                        "flex-1 rounded-xl font-bold flex items-center justify-center gap-2 transition text-sm",
                                        showPayoutForm
                                            ? "bg-green-600 text-white"
                                            : "bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    )}
                                >
                                    <DollarSign className="w-4 h-4" /> Enviar Pago
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPenaltyForm(!showPenaltyForm)
                                        setShowPayoutForm(false)
                                    }}
                                    className={cn(
                                        "flex-1 rounded-xl font-bold flex items-center justify-center gap-2 transition text-sm",
                                        showPenaltyForm
                                            ? "bg-red-600 text-white"
                                            : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                    )}
                                >
                                    <AlertTriangle className="w-4 h-4" /> Penalizar / Ajustar
                                </button>
                            </div>
                        </div>

                        {/* ACTION FORMS */}
                        {showPayoutForm && (
                            <div className="p-4 rounded-xl bg-green-900/10 border border-green-500/20 animate-in fade-in slide-in-from-top-2 space-y-4">
                                <h3 className="font-bold text-green-400 text-sm flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" /> Procesar Pago
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400">Monto a Pagar</label>
                                        <input
                                            type="number"
                                            value={payoutAmount}
                                            onChange={(e) => setPayoutAmount(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Mensaje / Nota (Opcional)</label>
                                        <textarea
                                            value={payoutMessage}
                                            onChange={(e) => setPayoutMessage(e.target.value)}
                                            placeholder="Ej: Pago de comisiones semana 4..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                            rows={2}
                                        />
                                    </div>
                                    <button
                                        onClick={handlePayout}
                                        disabled={processingPayout}
                                        className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                                    >
                                        {processingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Confirmar Pago
                                    </button>
                                </div>
                            </div>
                        )}

                        {showPenaltyForm && (
                            <div className="p-4 rounded-xl bg-red-900/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2 space-y-4">
                                <h3 className="font-bold text-red-400 text-sm flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Aplicar Descuento / Penalización
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400">Monto a Descontar</label>
                                        <input
                                            type="number"
                                            value={penaltyAmount}
                                            onChange={(e) => setPenaltyAmount(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Motivo (Requerido)</label>
                                        <textarea
                                            value={penaltyReason}
                                            onChange={(e) => setPenaltyReason(e.target.value)}
                                            placeholder="Ej: Multa por comportamiento inadecuado..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                            rows={2}
                                        />
                                    </div>
                                    <button
                                        onClick={handlePenalty}
                                        disabled={processingPenalty}
                                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                                    >
                                        {processingPenalty ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar Descuento'}
                                    </button>
                                </div>
                            </div>
                        )}


                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-white/5">
                                <TabsTrigger value="overview">Resumen</TabsTrigger>
                                <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                                <TabsTrigger value="financial">Historial</TabsTrigger>
                            </TabsList>

                            {/* OVERVIEW TAB */}
                            <TabsContent value="overview" className="space-y-4 py-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" /> Información Comercial
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <p className="text-xs text-gray-500">Código</p>
                                                <p className="font-mono font-bold text-violet-300">{creator.code}</p>
                                            </div>
                                            <div className="p-3 bg-white/5 rounded-lg">
                                                <p className="text-xs text-gray-500">Nicho</p>
                                                <p>{creator.niche || 'No definido'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" /> Contacto
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            {creator.whatsapp ? (
                                                <a href={`https://wa.me/${creator.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-[#1a3826] rounded-lg text-green-400 hover:bg-[#1a3826]/80 transition">
                                                    <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> WhatsApp</span>
                                                    <span className="font-mono">{creator.whatsapp}</span>
                                                </a>
                                            ) : (
                                                <div className="p-3 bg-white/5 rounded-lg text-gray-500 italic">Sin WhatsApp registrado</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                            <LayoutDashboard className="w-4 h-4" /> Redes Sociales
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            {creator.instagram && (
                                                <a href={`https://instagram.com/${creator.instagram.replace('@', '')}`} target="_blank" className="p-2 bg-pink-500/10 text-pink-400 rounded-lg flex items-center gap-2 hover:bg-pink-500/20 transition">
                                                    <Instagram className="w-4 h-4" /> {creator.instagram}
                                                </a>
                                            )}
                                            {creator.facebook && (
                                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg flex items-center gap-2">
                                                    <Facebook className="w-4 h-4" /> {creator.facebook}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* STATS TAB */}
                            <TabsContent value="stats" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-gray-300">Últimas Visitas (Check-ins)</h3>
                                    <div className="space-y-2">
                                        {creator.visits.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">No hay visitas registradas aún.</p>
                                        ) : (
                                            creator.visits.map((visit: any) => (
                                                <div key={visit.id} className="p-3 bg-white/5 rounded-lg flex justify-between items-center text-sm">
                                                    <div>
                                                        <p className="font-bold">{visit.place.name}</p>
                                                        <p className="text-xs text-gray-500">{new Date(visit.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className={cn(
                                                        "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                                                        visit.status === 'APPROVED' ? "bg-green-500/20 text-green-400" :
                                                            visit.status === 'REJECTED' ? "bg-red-500/20 text-red-500" :
                                                                "bg-yellow-500/20 text-yellow-400"
                                                    )}>
                                                        {visit.status}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* FINANCIAL TAB */}
                            <TabsContent value="financial" className="space-y-6 py-4">
                                {/* Payout History */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                                        <History className="w-4 h-4" /> Historial de Pagos
                                    </h3>
                                    <div className="bg-black/20 rounded-xl overflow-hidden text-sm">
                                        {creator.payouts.length === 0 ? (
                                            <p className="p-4 text-center text-gray-500 italic">Sin historial de pagos.</p>
                                        ) : (
                                            creator.payouts.map((payout: any) => (
                                                <div key={payout.id} className="p-3 border-b border-white/5 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-green-400">- ${payout.amount.toFixed(2)}</p>
                                                        <p className="text-xs text-gray-500">{new Date(payout.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-xs px-2 py-1 rounded font-bold",
                                                            payout.status.includes('STRIPE') ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-500"
                                                        )}>
                                                            {payout.status}
                                                        </span>
                                                        <PayoutReceiptButton
                                                            payout={payout}
                                                            creatorName={creator.user?.businessName || creator.code}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Commission History */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-bold text-gray-300">Últimos Movimientos (Comisiones / Ajustes)</h3>
                                    <div className="bg-black/20 rounded-xl overflow-hidden text-sm">
                                        {creator.commissions.length === 0 ? (
                                            <p className="p-4 text-center text-gray-500 italic">No hay comisiones registradas.</p>
                                        ) : (
                                            creator.commissions.map((comm: any) => (
                                                <div key={comm.id} className="p-3 border-b border-white/5 flex justify-between items-center">
                                                    <div>
                                                        <p className="font-bold text-white max-w-[200px] truncate" title={comm.description}>{comm.description}</p>
                                                        <p className="text-xs text-gray-500">{new Date(comm.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className={cn(
                                                        "font-bold",
                                                        comm.amount < 0 ? "text-red-400" : "text-green-400"
                                                    )}>
                                                        {comm.amount < 0 ? '-' : '+'}${Math.abs(comm.amount).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

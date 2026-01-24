"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Star, History, Calendar, Bell, MessageCircle, Gift } from "lucide-react"
import { toast } from "sonner"
import { getCustomerDetails } from "@/actions/loyalty"

interface LoyaltyCustomerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customerId: string | null
    initialData?: any // Optimistic data from list
}

export function LoyaltyCustomerDialog({ open, onOpenChange, customerId, initialData }: LoyaltyCustomerDialogProps) {
    const [customer, setCustomer] = useState<any>(initialData || null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && customerId) {
            loadDetails()
        }
    }, [open, customerId])

    const loadDetails = async () => {
        setIsLoading(true)
        try {
            const res = await getCustomerDetails(customerId!)
            if (res.success) {
                setCustomer(res.customer)
            } else {
                toast.error("Error al cargar detalles")
            }
        } catch (error) {
            toast.error("Error de conexión")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePushNotification = () => {
        // Placeholder for real push notification logic
        toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: "Enviando notificación...",
            success: "Notificación enviada al dispositivo",
            error: "No se pudo enviar"
        })
    }

    if (!customer && isLoading) return null // Or skeleton

    if (!customer) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#1a1a1a] border-zinc-800 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-4">
                    <div className="flex flex-col items-center gap-2 pt-4">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-indigo-900/40">
                            {customer.name?.charAt(0) || customer.phone?.charAt(0) || "?"}
                        </div>
                        <div className="text-center">
                            <DialogTitle className="text-2xl font-bold text-white">
                                {customer.name || "Cliente Sin Nombre"}
                            </DialogTitle>
                            <p className="text-zinc-400 font-mono text-xs mt-1">{customer.phone}</p>

                            {customer.tier && (
                                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-white/5"
                                    style={{ color: customer.tier.color, borderColor: `${customer.tier.color}40` }}>
                                    <Star className="w-3 h-3 fill-current" />
                                    {customer.tier.name}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 py-2">
                    <Button
                        onClick={handlePushNotification}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                    >
                        <Bell className="w-4 h-4" />
                        Notificar App
                    </Button>
                    <Button
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2"
                        onClick={() => window.open(`https://wa.me/${customer.phone?.replace(/[^0-9]/g, '')}`, '_blank')}
                    >
                        <MessageCircle className="w-5 h-5" />
                        WhatsApp
                    </Button>
                </div>

                {/* STATS GRID */}
                <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Puntos</p>
                        <p className="text-xl font-bold text-amber-400">{customer.currentPoints}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Visitas</p>
                        <p className="text-xl font-bold text-blue-400">{customer.totalVisits}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Miembro</p>
                        <p className="text-xs font-bold text-zinc-300 mt-1.5">
                            {new Date(customer.joinDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* INFO SECTIONS */}
                <div className="space-y-4 pt-2">

                    {/* VISITS HISTORY */}
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-400 mb-3 px-1">
                            <History className="w-4 h-4" />
                            Historial de Visitas
                        </h4>
                        <div className="space-y-2">
                            {customer.visits && customer.visits.length > 0 ? (
                                customer.visits.map((visit: any) => (
                                    <div key={visit.id} className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">
                                                    {new Date(visit.visitDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {new Date(visit.visitDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        {(visit.pointsEarned > 0 || visit.spendAmount > 0) && (
                                            <div className="text-right">
                                                {visit.pointsEarned > 0 && <p className="text-xs font-bold text-amber-500">+{visit.pointsEarned} pts</p>}
                                                {visit.spendAmount > 0 && <p className="text-xs text-zinc-500">${visit.spendAmount}</p>}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-zinc-600 text-sm py-2">Sin visitas registradas reciente.</p>
                            )}
                        </div>
                    </div>

                    {/* REDEMPTIONS */}
                    {customer.redemptions && customer.redemptions.length > 0 && (
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-400 mb-3 px-1 pt-2">
                                <Gift className="w-4 h-4" />
                                Canjes Recientes
                            </h4>
                            <div className="space-y-2">
                                {customer.redemptions.map((red: any) => (
                                    <div key={red.id} className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                                <Gift className="w-4 h-4" />
                                            </div>
                                            <p className="text-sm font-medium text-white">{red.reward?.name || "Premio"}</p>
                                        </div>
                                        <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded uppercase font-bold">
                                            {red.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </DialogContent>
        </Dialog>
    )
}

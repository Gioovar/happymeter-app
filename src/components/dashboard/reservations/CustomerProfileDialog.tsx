// @ts-nocheck
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Star, MessageCircle, Calendar } from "lucide-react"
import { toast } from "sonner"

interface CustomerProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer: {
        id: string | number
        name: string
        phone?: string
        email?: string
        visits?: number
        rating?: number
        lastVisit?: string
        table?: string
        notes?: string
    } | null
}

export function CustomerProfileDialog({ open, onOpenChange, customer }: CustomerProfileDialogProps) {
    if (!customer) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm bg-[#1a1a1a] border-zinc-800 text-white shadow-2xl">
                <DialogHeader className="space-y-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-orange-900/40">
                            {customer.name.charAt(0)}
                        </div>
                        <div className="text-center">
                            <DialogTitle className="text-2xl font-bold text-white">{customer.name}</DialogTitle>
                            <div className="flex items-center justify-center gap-1 text-amber-500 mt-1">
                                <span className="text-lg font-bold">{customer.rating || 5.0}</span>
                                <Star className="w-4 h-4 fill-current" />
                            </div>
                            <p className="text-zinc-400 text-sm mt-1">{customer.visits || 1} visitas • Última: {customer.lastVisit || 'Hoy'}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-3 py-4">
                    <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        Enviar Recordatorio WhatsApp
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white h-12 rounded-xl flex items-center justify-center gap-2">
                            <Phone className="w-4 h-4" />
                            Llamar
                        </Button>
                        <Button variant="outline" className="w-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white h-12 rounded-xl flex items-center justify-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </Button>
                    </div>
                </div>

                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase">Detalles de la Reserva</h4>

                    {/* TABLE INFO */}
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Mesa Reservada</p>
                            <p className="text-zinc-400 text-xs">{customer.table || "No asignada"}</p>
                        </div>
                    </div>

                    {/* NOTES INFO */}
                    {customer.notes && (
                        <div className="mt-3 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                            <p className="text-xs text-amber-500 font-bold mb-1 flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                Comentarios / Peticiones
                            </p>
                            <p className="text-sm text-zinc-300 italic">"{customer.notes}"</p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        onClick={async () => {
                            // Import action dynamically or assume passed prop? 
                            // Better to keep it clean. Importing directly is fine in Client Components in Next.js
                            const { updateReservationStatus } = await import("@/actions/reservations")
                            toast.promise(updateReservationStatus(customer.id, "SEATED"), {
                                loading: "Registrando asistencia...",
                                success: "¡Cliente marcado como ASISTIÓ!",
                                error: "Error al actualizar"
                            })
                            onOpenChange(false)
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl"
                    >
                        ✅ Asistió
                    </Button>
                    <Button
                        onClick={async () => {
                            const { updateReservationStatus } = await import("@/actions/reservations")
                            toast.promise(updateReservationStatus(customer.id, "NO_SHOW"), {
                                loading: "Actualizando...",
                                success: "Marcado como NO ASISTIÓ",
                                error: "Error al actualizar"
                            })
                            onOpenChange(false)
                        }}
                        variant="destructive"
                        className="w-full h-12 rounded-xl font-bold bg-white/5 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                    >
                        ❌ No Asistió
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

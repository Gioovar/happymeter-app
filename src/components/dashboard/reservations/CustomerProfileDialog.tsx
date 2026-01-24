// @ts-nocheck
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Star, MessageCircle, Calendar } from "lucide-react"
import { toast } from "sonner"
import { updateReservationStatus } from "@/actions/reservations"

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
    const [isLoading, setIsLoading] = useState(false)

    if (!customer) return null

    const handleStatusUpdate = async (status: string) => {
        setIsLoading(true)
        try {
            console.log("Updating status:", customer.id, status)
            const result = await updateReservationStatus(String(customer.id), status)

            if (result.success) {
                toast.success(status === 'SEATED' ? "¡Asistencia registrada!" : "Marcado como No Asistió")
                onOpenChange(false)
            } else {
                console.error("Update failed:", result.error)
                toast.error("Error: " + (result.error || "Desconocido"))
            }
        } catch (error) {
            console.error("Connection error:", error)
            toast.error("Error de conexión al actualizar")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm bg-[#1a1a1a] border-zinc-800 text-white shadow-2xl">
                <DialogHeader className="space-y-4">
                    <div className="flex flex-col items-center gap-2">
                        {/* ... existing header content ... */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-orange-900/40">
                            {customer.name.charAt(0)}
                        </div>
                        <div className="text-center">
                            <DialogTitle className="text-2xl font-bold text-white">{customer.name}</DialogTitle>
                            {/* Debug ID */}
                            <p className="text-[10px] text-zinc-600 font-mono">ID: {customer.id}</p>

                            <div className="flex items-center justify-center gap-1 text-amber-500 mt-1">
                                <span className="text-lg font-bold">{customer.rating || 5.0}</span>
                                <Star className="w-4 h-4 fill-current" />
                            </div>
                            <p className="text-zinc-400 text-sm mt-1">{customer.visits || 1} visitas • Última: {customer.lastVisit || 'Hoy'}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-3 py-4">
                    {/* ... existing buttons ... */}
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
                    {/* ... existing details ... */}
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-white font-medium">Mesa Reservada</p>
                            <p className="text-zinc-400 text-xs">{customer.table || "No asignada"}</p>
                        </div>
                    </div>

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
                        onClick={() => handleStatusUpdate("SEATED")}
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl disabled:opacity-50"
                    >
                        {isLoading ? "..." : "✅ Asistió"}
                    </Button>
                    <Button
                        onClick={() => handleStatusUpdate("NO_SHOW")}
                        disabled={isLoading}
                        variant="destructive"
                        className="w-full h-12 rounded-xl font-bold bg-white/5 hover:bg-red-500/20 text-red-500 border border-red-500/20 disabled:opacity-50"
                    >
                        {isLoading ? "..." : "❌ No Asistió"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

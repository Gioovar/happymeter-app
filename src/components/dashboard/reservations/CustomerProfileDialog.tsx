// @ts-nocheck
"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Phone, Mail, Star, MessageCircle, Calendar } from "lucide-react"

interface CustomerProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    customer: {
        name: string
        phone?: string
        email?: string
        visits?: number
        rating?: number
        lastVisit?: string
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

                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">Historial Reciente</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-white font-medium">Reservación Completada</p>
                                <p className="text-zinc-500 text-xs">Hace 2 semanas • Mesa 4</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

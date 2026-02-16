'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Phone,
    Mail,
    MessageSquare,
    CheckCircle2,
    Clock,
    AlertCircle,
    Copy,
    ExternalLink,
    Bot
} from 'lucide-react'
import { toast } from 'sonner'

interface StaffDetailModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    staff: any
}

export default function StaffDetailModal({ isOpen, onOpenChange, staff }: StaffDetailModalProps) {
    if (!staff) return null

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado al portapapeles`)
    }

    const { stats } = staff;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#0a0a0a] border-white/10 text-white overflow-hidden shadow-2xl">
                <DialogHeader className="border-b border-white/5 pb-6">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-xl overflow-hidden">
                            {staff.photo ? (
                                <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                            ) : (
                                staff.name[0]
                            )}
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-3xl font-extrabold tracking-tight">{staff.name}</DialogTitle>
                            <div className="flex items-center gap-3 mt-2">
                                <Badge variant="secondary" className="bg-white/5 text-gray-400 border border-white/10 px-3 py-1">
                                    {staff.jobTitle || staff.role}
                                </Badge>
                                <Badge className={
                                    stats.complianceRate >= 90 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                        stats.complianceRate >= 70 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                            "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }>
                                    <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                    {stats.complianceRate}% Cumplimiento
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-8 py-6">
                    {/* Left Column: Stats & Contact */}
                    <div className="space-y-8">
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Reporte Operativo (Hoy)</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gray-900/50 p-4 rounded-2xl border border-white/5 transition-colors hover:bg-gray-900">
                                    <p className="text-2xl font-black text-white">{stats.total}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Total</p>
                                </div>
                                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 transition-colors hover:bg-emerald-500/10">
                                    <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
                                    <p className="text-[10px] text-emerald-500/70 font-bold uppercase mt-1">Hechas</p>
                                </div>
                                <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 transition-colors hover:bg-rose-500/10">
                                    <p className="text-2xl font-black text-rose-400">{stats.missed + stats.pending}</p>
                                    <p className="text-[10px] text-rose-500/70 font-bold uppercase mt-1">Pendientes</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Información de Contacto</h3>
                            <div className="space-y-3">
                                {staff.contact.phone && (
                                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-white/5 group hover:border-violet-500/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-violet-500/10 rounded-xl">
                                                <Phone className="w-4 h-4 text-violet-400" />
                                            </div>
                                            <span className="text-sm font-medium">{staff.contact.phone}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-violet-500/10" onClick={() => copyToClipboard(staff.contact.phone, 'Teléfono')}>
                                                <Copy className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-emerald-500/10" asChild>
                                                <a href={`tel:${staff.contact.phone}`}>
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-white/5 group hover:border-violet-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-500/10 rounded-xl">
                                            <Mail className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <span className="text-sm font-medium truncate max-w-[150px]">{staff.contact.email || 'Email no registrado'}</span>
                                    </div>
                                    {staff.contact.email && (
                                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => copyToClipboard(staff.contact.email!, 'Email')}>
                                            <Copy className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Chat Box */}
                    <div className="bg-gray-900 rounded-3xl border border-white/5 flex flex-col h-full min-h-[350px] relative overflow-hidden group">
                        {/* Ambient glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 blur-[60px] pointer-events-none group-hover:bg-violet-600/20 transition-all" />

                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Canal de Comunicación</span>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-white/10 uppercase">Interno</Badge>
                        </div>

                        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                                <MessageSquare className="w-8 h-8 text-violet-500" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-white">Instrucciones en Tiempo Real</p>
                                <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                                    Envía mensajes directos que aparecerán como notificaciones en su App de Operaciones.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/5">
                            <div className="relative group/input">
                                <input
                                    type="text"
                                    placeholder="Mensaje rápido..."
                                    className="w-full bg-gray-950/80 border border-white/10 rounded-2xl py-3 px-5 text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-gray-600"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-violet-600 rounded-xl hover:bg-violet-500 hover:scale-105 active:scale-95 transition-all text-white shadow-lg shadow-violet-600/20">
                                    <Send className="w-4 h-4" size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

import { Send } from 'lucide-react'

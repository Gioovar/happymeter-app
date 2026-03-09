"use client"

import { useState } from "react"
import { Clock, CheckCircle2, AlertCircle, Phone, MessageCircle, FileText, X } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TaskItemCardProps {
    task: {
        taskId: string
        taskTitle: string
        limitTime: string | null
        zoneName: string
        evidenceType: string
        status: string
        evidenceId?: string
        evidenceUrl?: string
        submittedAt?: Date | string
    }
    employee: {
        name: string
        role: string
        phone: string | null
    }
    mode: 'employee' | 'issue' // Determines slight visual differences
}

export function TaskItemCard({ task, employee, mode }: TaskItemCardProps) {
    const [open, setOpen] = useState(false)

    const isDone = ['APPROVED', 'REJECTED', 'REVIEW'].includes(task.status)
    const statusText = task.status === 'APPROVED' ? 'APROBADA' :
        task.status === 'REJECTED' ? 'RECHAZADA' :
            task.status === 'REVIEW' ? 'POR REVISAR' :
                task.status === 'DELAYED' ? 'RETRASADO' : 'PENDIENTE'

    const handleWhatsApp = () => {
        if (!employee.phone) return;
        const phone = employee.phone.replace(/\D/g, '');
        const message = encodeURIComponent(`Hola ${employee.name}, te escribo por la tarea: "${task.taskTitle}" (${task.zoneName}).`);
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }

    const handleCall = () => {
        if (!employee.phone) return;
        window.open(`tel:${employee.phone}`, '_self');
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className={`cursor-pointer ${mode === 'issue' ? 'bg-[#111] border border-red-500/20 hover:border-red-500/40' : 'bg-[#111] border border-white/10 hover:border-violet-500/30'} rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all group`}>
                    {/* Left: Info */}
                    <div className="flex items-start gap-4">
                        {mode === 'issue' && (
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            </div>
                        )}
                        <div className="space-y-1 text-left">
                            <div className="flex items-center gap-2">
                                <h3 className="text-white font-medium group-hover:text-violet-400 transition-colors">{task.taskTitle}</h3>
                                {task.limitTime && (
                                    <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {task.limitTime}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500">{task.zoneName}</p>
                        </div>
                    </div>

                    {/* Right/Middle: Status */}
                    <div className="flex items-center gap-4">
                        {mode === 'issue' ? (
                            <div className="flex items-center gap-4">
                                {task.limitTime && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Límite</p>
                                        <p className="font-mono text-white">{task.limitTime}</p>
                                    </div>
                                )}
                                <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                                    Retrasado
                                </Badge>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${task.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                                    task.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                                        task.status === 'REVIEW' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-white/5 text-gray-500'
                                    }`}>
                                    {task.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> :
                                        task.status === 'REJECTED' ? <AlertCircle className="w-4 h-4" /> :
                                            task.status === 'REVIEW' ? <Clock className="w-4 h-4" /> :
                                                <Clock className="w-4 h-4 opacity-50" />}

                                    {statusText}
                                </div>
                                <div className="text-gray-600 group-hover:text-white transition-colors text-sm px-2">Ver Detalle</div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogTrigger>

            {/* MODAL / POPUP DETAILS */}
            <DialogContent className="bg-[#111111] border-white/10 text-white max-w-sm sm:max-w-md p-0 overflow-hidden hide-scrollbar">

                {/* Employee Info Header Header */}
                <div className="p-8 pb-6 flex flex-col items-center justify-center text-center space-y-4 pt-10 relative">
                    {/* Floating Avatar */}
                    <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center border-2 border-indigo-500/30 overflow-hidden text-2xl font-bold uppercase shadow-lg shadow-indigo-500/20">
                        {employee.name.charAt(0)}
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">{employee.name}</h2>
                        <p className="text-sm font-medium text-indigo-400/80 uppercase tracking-widest">{employee.role === 'OPERATOR' ? 'Operador' : employee.role}</p>
                    </div>

                    {/* Task Title quote */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-2 w-full">
                        <p className="text-sm italic text-zinc-300">"{task.taskTitle}"</p>
                    </div>
                </div>

                {/* Task Details Section */}
                <div className="px-6 pb-6">
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-sm font-medium text-zinc-500">¿Se realizó la tarea?</span>
                            <span className={`font-bold text-sm ${isDone ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                {isDone ? 'Sí - Entregada' : 'No - Sin realizarse'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-sm font-medium text-zinc-500">Estado</span>
                            <span className="font-bold text-sm text-white">{statusText}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-sm font-medium text-zinc-500">Área / Zona</span>
                            <span className="font-bold text-sm text-white">{task.zoneName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-zinc-500">Límite de tiempo</span>
                            <span className="font-bold text-sm text-white">{task.limitTime || 'Sin límite'}</span>
                        </div>
                    </div>

                    {/* Evidence Section */}
                    <div className="mt-6 space-y-3">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">EVIDENCIA</h3>
                        {task.evidenceUrl ? (
                            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={task.evidenceUrl} alt="Evidencia" className="object-cover w-full h-full" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 rounded-xl bg-white/5 border border-dashed border-white/10 text-zinc-500">
                                <FileText className="w-8 h-8 opacity-50 mb-2" />
                                <p className="text-sm">Sin evidencia adjunta</p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 mt-8">
                        <Button
                            onClick={handleWhatsApp}
                            disabled={!employee.phone}
                            className="bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 h-12 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,211,102,0.1)] transition-all"
                        >
                            <MessageCircle className="w-5 h-5 mr-0" />
                        </Button>
                        <Button
                            onClick={handleCall}
                            disabled={!employee.phone}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 h-12 rounded-xl flex items-center justify-center transition-all"
                        >
                            <Phone className="w-5 h-5 mr-0" />
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    )
}

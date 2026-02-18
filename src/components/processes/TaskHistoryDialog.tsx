
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, Calendar, CheckCircle2, User, Camera, ArrowRight, Loader2, XCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getTaskHistory } from '@/actions/processes'
import Image from 'next/image'

interface TaskHistory {
    id: string
    // fileUrl: string // Removed in favor of media array
    submittedAt: Date | string
    completedBy: string
    completedByPhoto?: string | null
    status: string // ON_TIME, LATE
    comments?: string | null
    media: { id: string, url: string, type: 'PHOTO' | 'VIDEO' }[]
}

interface TaskHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task: any
    onStartTask: () => void
    onAssign?: () => void
    onEdit?: () => void
}

export default function TaskHistoryDialog({ open, onOpenChange, task, onStartTask, onAssign, onEdit }: TaskHistoryDialogProps) {
    const [history, setHistory] = useState<TaskHistory[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedEvidence, setSelectedEvidence] = useState<TaskHistory | null>(null)

    useEffect(() => {
        if (open && task?.id) {
            fetchHistory()
        } else {
            setHistory([])
            setSelectedEvidence(null)
        }
    }, [open, task])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            const data = await getTaskHistory(task.id)
            setHistory(data as any)
        } catch (error) {
            console.error("Failed to load history", error)
        } finally {
            setLoading(false)
        }
    }

    if (!task) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-2xl p-0 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col">
                <div className="bg-[#111] p-4 border-b border-white/10 shrink-0 z-20">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {task.title}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">{task.description || 'Sin descripción'}</p>
                            {task.limitTime && (
                                <div className="flex items-center gap-2 mt-2">
                                    <Clock className="w-3.5 h-3.5 text-orange-400" />
                                    <span className="text-xs text-orange-400 font-mono">Límite: {task.limitTime}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {onEdit && (
                                <Button variant="ghost" size="sm" onClick={onEdit} className="hidden sm:flex text-gray-400 hover:text-white hover:bg-white/5">
                                    <span className="mr-2">✏️</span> Editar
                                </Button>
                            )}
                            {onAssign && (
                                <Button variant="outline" size="sm" onClick={onAssign} className="hidden sm:flex border-white/10 hover:bg-white/5">
                                    Asignar
                                </Button>
                            )}
                            <Button
                                onClick={() => {
                                    onOpenChange(false)
                                    onStartTask()
                                }}
                                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/20"
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Realizar Tarea
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-black/20">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Historial de Ejecución
                    </h3>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 border border-dashed border-white/10 rounded-xl">
                            <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p>No hay registros previos de esta tarea.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((record) => (
                                <div
                                    key={record.id}
                                    className="group bg-[#111] border border-white/10 hover:border-white/20 rounded-xl p-3 flex items-center gap-4 transition-all hover:bg-white/5 cursor-pointer"
                                    onClick={() => setSelectedEvidence(record)}
                                >
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 rounded-lg bg-black shrink-0 overflow-hidden relative border border-white/5 flex items-center justify-center">
                                        {record.media && record.media.length > 0 ? (
                                            record.media[0].type === 'VIDEO' ? (
                                                <video src={record.media[0].url} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={record.media[0].url} alt="Evidence" className="w-full h-full object-cover" />
                                            )
                                        ) : (
                                            <div className="bg-gray-800 w-full h-full flex items-center justify-center">
                                                <Camera className="w-4 h-4 text-gray-500" />
                                            </div>
                                        )}

                                        {record.media && record.media.length > 1 && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">+{record.media.length - 1}</span>
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-white font-medium text-sm">
                                                {format(new Date(record.submittedAt), "EEEE d 'de' MMMM", { locale: es })}
                                            </span>
                                            {record.status === 'LATE' && (
                                                <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                                                    Tarde
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {format(new Date(record.submittedAt), "HH:mm a")}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {record.completedBy}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-gray-600 group-hover:text-cyan-400 transition-colors">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Evidence Preview Overlay */}
                {/* Evidence Detail Card (Ficha) */}
                {selectedEvidence && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedEvidence(null)}>
                        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedEvidence(null)}
                                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 z-20 md:hidden"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>

                            {/* Media Section - Scrollable if multiple */}
                            <div className="relative w-full md:w-1/2 bg-black flex flex-col overflow-y-auto custom-scrollbar max-h-[50vh] md:max-h-full">
                                {selectedEvidence.media && selectedEvidence.media.map((item, index) => (
                                    <div key={item.id} className="relative w-full shrink-0 border-b border-white/10 last:border-0">
                                        {item.type === 'VIDEO' ? (
                                            <video src={item.url} controls className="w-full max-h-[400px] object-contain" />
                                        ) : (
                                            <img src={item.url} alt={`Evidence ${index + 1}`} className="w-full h-auto object-contain" />
                                        )}
                                        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white backdrop-blur-sm">
                                            {item.type === 'VIDEO' ? 'VIDEO' : 'FOTO'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Details Section */}
                            <div className="p-6 md:w-1/2 flex flex-col justify-between bg-[#0a0a0a]">
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-white">Detalle de Evidencia</h3>
                                        <button onClick={() => setSelectedEvidence(null)} className="hidden md:block text-gray-500 hover:text-white">
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {/* User Info */}
                                        <div className="flex items-center gap-4">
                                            <Avatar className="w-12 h-12 border-2 border-white/10">
                                                <AvatarImage src={selectedEvidence.completedByPhoto || undefined} />
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                                                    {selectedEvidence.completedBy[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Realizado por</p>
                                                <p className="text-white font-bold text-lg leading-none">{selectedEvidence.completedBy}</p>
                                            </div>
                                        </div>

                                        {/* Date/Time */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Fecha</p>
                                                <p className="text-white flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-cyan-500" />
                                                    {format(new Date(selectedEvidence.submittedAt), "dd MMM yyyy", { locale: es })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Hora</p>
                                                <p className="text-white flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-cyan-500" />
                                                    {format(new Date(selectedEvidence.submittedAt), "HH:mm a")}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Estado</p>
                                            {selectedEvidence.status === 'LATE' ? (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    Entregado Tarde
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    A Tiempo
                                                </div>
                                            )}
                                        </div>

                                        {/* Comments */}
                                        {selectedEvidence.comments && (
                                            <div>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Comentarios</p>
                                                <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-300 border border-white/5 italic">
                                                    "{selectedEvidence.comments}"
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

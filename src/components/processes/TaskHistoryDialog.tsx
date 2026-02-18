
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
    fileUrl: string
    submittedAt: Date | string
    completedBy: string
    completedByPhoto?: string | null
    status: string // ON_TIME, LATE
    comments?: string | null
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
                                    <div className="w-12 h-12 rounded-lg bg-black shrink-0 overflow-hidden relative border border-white/5">
                                        {record.fileUrl.endsWith('.mp4') || record.fileUrl.endsWith('.webm') ? (
                                            <video src={record.fileUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <Image src={record.fileUrl} alt="Evidence" fill className="object-cover" sizes="48px" />
                                        )}
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
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
                {selectedEvidence && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedEvidence(null)}>
                        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedEvidence(null)}
                                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 z-20"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>

                            <div className="relative aspect-[4/3] bg-black">
                                {selectedEvidence.fileUrl.endsWith('.mp4') || selectedEvidence.fileUrl.endsWith('.webm') ? (
                                    <video src={selectedEvidence.fileUrl} controls className="w-full h-full object-contain" autoPlay />
                                ) : (
                                    <Image src={selectedEvidence.fileUrl} alt="Full Evidence" fill className="object-contain" />
                                )}
                            </div>

                            <div className="p-4 bg-[#111]">
                                <div className="flex items-center gap-3 mb-4">
                                    <Avatar className="w-10 h-10 border border-white/10">
                                        <AvatarImage src={selectedEvidence.completedByPhoto || undefined} />
                                        <AvatarFallback>{selectedEvidence.completedBy[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold text-white">{selectedEvidence.completedBy}</p>
                                        <p className="text-xs text-gray-400">{format(new Date(selectedEvidence.submittedAt), "PPP p", { locale: es })}</p>
                                    </div>
                                </div>

                                {selectedEvidence.comments && (
                                    <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300 border border-white/5">
                                        <p className="italic">"{selectedEvidence.comments}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

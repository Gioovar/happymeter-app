
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
                {/* Evidence Detail Card (Ficha Responsive Premium - Cinema Mode Desktop) */}
                {selectedEvidence && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedEvidence(null)}>
                        <div
                            className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden w-full max-w-xl md:max-w-7xl md:w-[90vw] md:h-[90vh] shadow-2xl relative flex flex-col md:flex-row max-h-[90vh] md:max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close Button Desktop - Absolute */}
                            <button
                                onClick={() => setSelectedEvidence(null)}
                                className="hidden md:flex absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-30 bg-black/50 backdrop-blur-md border border-white/10"
                            >
                                <XCircle className="w-8 h-8" />
                            </button>

                            {/* Media Section - Cinema View (Left) */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-black order-2 md:order-1 border-t md:border-t-0 md:border-r border-white/5 relative flex flex-col items-center justify-center">
                                <div className="w-full h-full flex flex-col items-center p-1 space-y-1 md:p-0 md:space-y-0 overflow-y-auto custom-scrollbar">
                                    {selectedEvidence.media && selectedEvidence.media.length > 0 ? (
                                        selectedEvidence.media.map((item, index) => (
                                            <div key={item.id} className="relative w-full group shrink-0 md:h-full md:flex md:items-center md:justify-center md:bg-black">
                                                {item.type === 'VIDEO' ? (
                                                    <div className="relative w-full aspect-video bg-[#050505] md:w-full md:h-full md:aspect-auto flex items-center justify-center">
                                                        <video
                                                            src={item.url}
                                                            controls
                                                            className="w-full h-full object-contain max-h-[50vh] md:max-h-full"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="relative w-full bg-[#050505] md:w-full md:h-full md:flex md:items-center md:justify-center">
                                                        <img
                                                            src={item.url}
                                                            alt={`Evidence ${index + 1}`}
                                                            className="w-full h-auto object-contain max-h-[50vh] md:max-h-full md:max-w-full mx-auto"
                                                        />
                                                    </div>
                                                )}

                                                {/* Type Badge Overlay */}
                                                <div className="absolute top-3 left-3 bg-black/70 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white backdrop-blur border border-white/10 flex items-center gap-1.5 pointer-events-none md:top-6 md:left-6 z-20">
                                                    {item.type === 'VIDEO' ? <Camera className="w-3 h-3 text-cyan-400" /> : <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                                    {item.type === 'VIDEO' ? 'VIDEO' : 'FOTO'}
                                                    <span className="hidden md:inline text-gray-400 ml-2 pl-2 border-l border-white/20">
                                                        {index + 1} / {selectedEvidence.media.length}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 h-full w-full">
                                            <AlertTriangle className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="text-sm">Sin evidencia visual</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info Section - Sidebar (Right) */}
                            <div className="p-6 bg-[#0f0f0f] border-b md:border-b-0 md:bg-[#0a0a0a] relative shrink-0 order-1 md:order-2 md:w-[400px] md:border-l md:border-white/5 md:overflow-y-auto md:p-8 flex flex-col">
                                <button
                                    onClick={() => setSelectedEvidence(null)}
                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors md:hidden"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>

                                <div className="flex flex-col gap-6 md:gap-8 flex-1">
                                    {/* Staff Profile */}
                                    <div className="flex items-center gap-4 md:flex-col md:items-center md:text-center md:gap-4 md:mt-4">
                                        <Avatar className="w-16 h-16 border-2 border-white/10 shadow-lg md:w-28 md:h-28 ring-4 ring-black/40">
                                            <AvatarImage src={selectedEvidence.completedByPhoto || undefined} />
                                            <AvatarFallback className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-bold text-xl md:text-4xl">
                                                {selectedEvidence.completedBy[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-wider mb-2 border border-cyan-500/20 md:mb-3">
                                                Realizado por
                                            </div>
                                            <h3 className="text-white font-bold text-xl leading-tight md:text-2xl mb-1">{selectedEvidence.completedBy}</h3>
                                            <p className="text-sm text-gray-400">Colaborador</p>
                                        </div>
                                    </div>

                                    {/* Sub Info Grid */}
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:gap-4 md:mt-4">
                                        <div className="bg-gradient-to-br from-white/5 to-transparent p-3 rounded-xl border border-white/5 md:p-4">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 md:mb-2">Fecha y Hora</p>
                                            <p className="text-white text-sm font-medium flex items-center gap-2 md:text-lg">
                                                <Calendar className="w-3.5 h-3.5 text-cyan-500 md:w-5 md:h-5" />
                                                {format(new Date(selectedEvidence.submittedAt), "d MMM, HH:mm a", { locale: es })}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`p-3 rounded-xl border flex items-center gap-3 md:p-4 ${selectedEvidence.status === 'LATE'
                                                ? 'bg-red-500/5 border-red-500/20'
                                                : 'bg-green-500/5 border-green-500/20'
                                            }`}>
                                            {selectedEvidence.status === 'LATE' ? (
                                                <>
                                                    <div className="p-2 bg-red-500/10 rounded-full md:p-2.5 shrink-0">
                                                        <AlertTriangle className="w-4 h-4 text-red-500 md:w-5 md:h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider md:text-xs">Estado</p>
                                                        <p className="text-red-400 font-bold text-sm md:text-base">Tarde</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="p-2 bg-green-500/10 rounded-full md:p-2.5 shrink-0">
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 md:w-5 md:h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider md:text-xs">Estado</p>
                                                        <p className="text-green-400 font-bold text-sm md:text-base">A Tiempo</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Comments */}
                                    {selectedEvidence.comments && (
                                        <div className="p-4 bg-[#111] border border-white/5 rounded-xl md:p-5 relative md:bg-transparent">
                                            <span className="text-2xl text-white/10 absolute top-2 left-2 font-serif select-none">"</span>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2 pl-2">Comentarios</p>
                                            <p className="text-sm text-gray-300 italic md:text-base pl-2 relative z-10">{selectedEvidence.comments}</p>
                                        </div>
                                    )}

                                    <div className="flex-1 hidden md:block" />

                                    {/* Action Button */}
                                    <Button className="w-full bg-white text-black hover:bg-gray-200 border border-transparent h-10 rounded-xl font-bold gap-2 transition-all md:h-12 md:text-base shadow-lg shadow-white/5">
                                        <span>💬</span> Enviar mensaje
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

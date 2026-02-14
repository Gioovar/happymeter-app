
'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, User, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { getProcessZoneHistory } from '@/actions/processes'
import { cn } from '@/lib/utils'

interface ProcessHistoryViewProps {
    zoneId: string
}

export default function ProcessHistoryView({ zoneId }: ProcessHistoryViewProps) {
    const [date, setDate] = useState<Date>(new Date())
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [selectedEvidence, setSelectedEvidence] = useState<any>(null)

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true)
            try {
                const dateStr = format(date, 'yyyy-MM-dd')
                const result = await getProcessZoneHistory(zoneId, dateStr)
                setData(result)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [date, zoneId])

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
                <Card className="bg-[#111] border-white/10">
                    <CardContent className="p-4">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setDate(d)}
                            disabled={(d) => d > new Date() || d < new Date("2024-01-01")}
                            className="bg-transparent text-white w-full flex justify-center"
                            classNames={{
                                head_cell: "text-gray-500 font-normal text-[0.8rem]",
                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: cn(
                                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-lg transition-colors text-white"
                                ),
                                day_selected:
                                    "bg-cyan-600 text-white hover:bg-cyan-600 hover:text-white focus:bg-cyan-600 focus:text-white",
                                day_today: "bg-white/10 text-white",
                                day_outside:
                                    "day-outside text-gray-500 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                day_disabled: "text-gray-700 opacity-50",
                                day_range_middle:
                                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                day_hidden: "invisible",
                                nav_button_previous: "text-white hover:bg-white/10",
                                nav_button_next: "text-white hover:bg-white/10",
                                caption: "text-white capitalize font-medium mb-4",
                            }}
                        />
                    </CardContent>
                </Card>

                {data && (
                    <Card className="bg-[#111] border-white/10">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-bold text-white text-lg">Resumen del Día</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                                    <p className="text-xs text-green-400 font-bold uppercase">Completadas</p>
                                    <p className="text-2xl font-bold text-green-400">{data.stats?.completed || 0}</p>
                                </div>
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                                    <p className="text-xs text-red-400 font-bold uppercase">No Realizadas</p>
                                    <p className="text-2xl font-bold text-red-400">{data.stats?.missed || 0}</p>
                                </div>
                            </div>
                            <div className="pt-2">
                                <p className="text-gray-400 text-sm mb-2">Progreso</p>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                                        style={{ width: `${data.stats?.total ? ((data.stats.completed / data.stats.total) * 100) : 0}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white capitalize">
                        {format(date, "EEEE d 'de' MMMM", { locale: es })}
                    </h2>
                    {loading && <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : !data || data.tasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                        <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No hay tareas registradas para esta fecha.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.tasks.map((task: any) => (
                            <div
                                key={task.id}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all",
                                    task.status === 'COMPLETED' ? "bg-green-500/5 border-green-500/10 hover:bg-green-500/10 cursor-pointer" :
                                        task.status === 'MISSED' ? "bg-red-500/5 border-red-500/10" : "bg-[#111] border-white/10"
                                )}
                                onClick={() => task.status === 'COMPLETED' && task.evidence && setSelectedEvidence({ ...task.evidence, title: task.title })}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                        task.status === 'COMPLETED' ? "bg-green-500/10 text-green-400" :
                                            task.status === 'MISSED' ? "bg-red-500/10 text-red-400" : "bg-gray-500/10 text-gray-400"
                                    )}>
                                        {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> :
                                            task.status === 'MISSED' ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className={cn("font-medium", task.status === 'COMPLETED' ? "text-white" : "text-gray-300")}>
                                            {task.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            {task.limitTime && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Límite: {task.limitTime}
                                                </span>
                                            )}
                                            {task.evidence && (
                                                <span className="text-green-400 flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {task.evidence.completedBy}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {task.status === 'COMPLETED' && (
                                        <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-0">
                                            Ver Evidencia
                                        </Badge>
                                    )}
                                    {task.status === 'MISSED' && (
                                        <Badge variant="outline" className="border-red-500/20 text-red-500">
                                            No Realizado
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selectedEvidence} onOpenChange={(open) => !open && setSelectedEvidence(null)}>
                <DialogContent className="bg-black/90 border border-white/10 text-white max-w-sm w-[90%] rounded-3xl p-0 overflow-hidden backdrop-blur-xl">
                    {selectedEvidence && (
                        <div className="flex flex-col max-h-[85vh]">
                            <div className="bg-black relative aspect-[9/16] w-full shrink-0 max-h-[60vh] flex items-center justify-center overflow-hidden border-b border-white/10">
                                {selectedEvidence.fileUrl.endsWith('.webm') || selectedEvidence.fileUrl.endsWith('.mp4') ? (
                                    <video
                                        src={selectedEvidence.fileUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                        autoPlay
                                    />
                                ) : (
                                    <img
                                        src={selectedEvidence.fileUrl}
                                        alt="Evidencia"
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>
                            <div className="p-6 space-y-4 bg-[#111]">
                                <div>
                                    <h2 className="text-lg font-bold leading-tight mb-1 line-clamp-2">{selectedEvidence.title}</h2>
                                    <p className="text-green-400 font-medium text-xs flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Tarea Completada
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                    <Avatar className="w-8 h-8 border border-white/10">
                                        <AvatarImage src={selectedEvidence.completedByPhoto || undefined} />
                                        <AvatarFallback className="bg-indigo-500/20 text-indigo-400 text-xs">
                                            <User className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Realizado por</p>
                                        <p className="text-white text-sm font-bold">{selectedEvidence.completedBy}</p>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(selectedEvidence.submittedAt), "PPP p", { locale: es })}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}


'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, User, ChevronLeft, ChevronRight, Loader2, BarChart3, PieChart } from 'lucide-react'
import { getProcessZoneHistory } from '@/actions/processes'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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

    const completionRate = data?.stats?.total ? Math.round((data.stats.completed / data.stats.total) * 100) : 0

    return (
        <div className="space-y-6 h-full">
            {/* Top Metrics Row */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Compliance Card */}
                    <div className="bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Cumplimiento Día</p>
                                <h3 className="text-4xl font-black text-white mt-2">{completionRate}%</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <PieChart className="w-5 h-5 text-cyan-400" />
                            </div>
                        </div>
                        <div className="w-full bg-gray-800/50 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completionRate}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn(
                                    "h-full rounded-full",
                                    completionRate >= 80 ? "bg-gradient-to-r from-green-500 to-emerald-400" :
                                        completionRate >= 50 ? "bg-gradient-to-r from-yellow-500 to-orange-400" :
                                            "bg-gradient-to-r from-red-500 to-rose-400"
                                )}
                            />
                        </div>
                    </div>

                    {/* Completed Tasks */}
                    <div className="bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Completadas</p>
                                <h3 className="text-4xl font-black text-white mt-2">{data.stats?.completed || 0}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                        </div>
                    </div>

                    {/* Missed Tasks */}
                    <div className="bg-[#111] border border-white/10 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-opacity group-hover:opacity-100" />
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">No Realizadas</p>
                                <h3 className="text-4xl font-black text-white mt-2">{data.stats?.missed || 0}</h3>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Left: Calendar (More Space) */}
                <div className="lg:col-span-4 xl:col-span-4">
                    <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 relative group h-fit sticky top-6">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-cyan-400" />
                            Calendario
                        </h3>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setDate(d)}
                            disabled={(d) => d > new Date() || d < new Date("2024-01-01")}
                            className="bg-transparent text-white w-full p-0 flex justify-center"
                            classNames={{
                                months: "w-full space-y-4",
                                month: "space-y-4 w-full",
                                caption: "flex justify-center pt-1 relative items-center mb-4",
                                caption_label: "text-xl font-bold text-white capitalize",
                                nav: "space-x-1 flex items-center bg-white/5 rounded-xl p-0.5 absolute right-2 top-2 z-10",
                                nav_button: "h-8 w-8 bg-transparent p-0 hover:opacity-100 transition-all hover:bg-white/10 rounded-lg text-gray-400 hover:text-white flex items-center justify-center",
                                nav_button_previous: "absolute static border-0",
                                nav_button_next: "absolute static border-0",
                                table: "w-full border-collapse space-y-2",
                                head_row: "flex w-full justify-between mb-2",
                                head_cell: "text-gray-500 rounded-md w-full font-medium text-[0.8rem] uppercase tracking-wider",
                                row: "flex w-full mt-2 justify-between",
                                cell: "h-12 w-full text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: cn(
                                    "h-12 w-full p-0 font-medium aria-selected:opacity-100 hover:bg-white/10 rounded-xl transition-all text-gray-300 hover:text-white flex items-center justify-center text-base"
                                ),
                                day_selected:
                                    "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 rounded-xl font-bold scale-105",
                                day_today: "bg-white/5 text-white border border-white/10 rounded-xl",
                                day_outside: "text-gray-700 opacity-30",
                                day_disabled: "text-gray-800 opacity-20",
                            }}
                        />
                    </div>
                </div>

                {/* Right: Logs (Wider) */}
                <div className="lg:col-span-8 xl:col-span-8 space-y-6">
                    <div className="flex items-center justify-between bg-[#111] p-6 rounded-3xl border border-white/10">
                        <div>
                            <h2 className="text-2xl font-bold text-white capitalize tracking-tight">
                                {format(date, "EEEE d 'de' MMMM", { locale: es })}
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                {data?.tasks?.length || 0} tareas programadas para este día
                            </p>
                        </div>
                        {loading && <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />}
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-24 bg-[#111] rounded-3xl border border-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : !data || data.tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-[#111] rounded-3xl border border-white/10 border-dashed">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <CalendarIcon className="w-10 h-10 opacity-30" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Sin actividad</h3>
                            <p className="max-w-xs text-center">No hay registros de tareas para la fecha seleccionada.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {data.tasks.map((task: any, index: number) => (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={cn(
                                        "group relative overflow-hidden p-1 rounded-3xl transition-all duration-300 h-full",
                                        task.status === 'COMPLETED' ? "hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/10 cursor-pointer" : ""
                                    )}
                                    onClick={() => task.status === 'COMPLETED' && task.evidence && setSelectedEvidence({ ...task.evidence, title: task.title })}
                                >
                                    <div className={cn(
                                        "relative bg-[#111] p-5 rounded-[1.3rem] border transition-all flex flex-col justify-between h-full gap-4",
                                        task.status === 'COMPLETED' ? "border-green-500/20 shadow-lg shadow-green-900/5" :
                                            task.status === 'MISSED' ? "border-red-500/20 bg-red-950/5" : "border-white/10"
                                    )}>
                                        <div className="flex items-start gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-colors",
                                                task.status === 'COMPLETED' ? "bg-green-500/10 border-green-500/20 text-green-400 group-hover:scale-110 duration-300" :
                                                    task.status === 'MISSED' ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-white/5 border-white/10 text-gray-500"
                                            )}>
                                                {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5" /> :
                                                    task.status === 'MISSED' ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className={cn(
                                                    "font-bold text-base leading-tight transition-colors line-clamp-2",
                                                    task.status === 'COMPLETED' ? "text-white group-hover:text-green-400" :
                                                        task.status === 'MISSED' ? "text-gray-300" : "text-gray-400"
                                                )}>
                                                    {task.title}
                                                </h4>

                                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                    {task.limitTime && (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 shrink-0">
                                                            <Clock className="w-3 h-3 text-gray-400" />
                                                            <span className="text-[10px] font-mono text-gray-300">{task.limitTime}</span>
                                                        </div>
                                                    )}

                                                    {task.evidence ? (
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <Avatar className="w-4 h-4 border border-white/10">
                                                                <AvatarImage src={task.evidence.completedByPhoto || undefined} />
                                                                <AvatarFallback className="text-[8px] bg-indigo-500 text-white">
                                                                    {task.evidence.completedBy?.[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-[10px] text-gray-400 truncate max-w-[80px]">{task.evidence.completedBy}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <Avatar className="w-4 h-4 border border-white/10 grayscale opacity-50">
                                                                <AvatarImage src={task.responsiblePhoto || undefined} />
                                                                <AvatarFallback className="text-[8px] bg-gray-500 text-white">
                                                                    {task.responsible?.[0] || 'A'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
                                                                {task.responsible || 'Sin asignar'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                                            {task.evidence && (
                                                <span className="text-[10px] text-gray-600 font-mono flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {format(new Date(task.evidence.submittedAt), "HH:mm")}
                                                </span>
                                            )}

                                            <div className="ml-auto">
                                                {task.status === 'COMPLETED' && (
                                                    <Badge className="bg-green-500 text-black hover:bg-green-400 font-bold px-2 py-0.5 text-[10px]">
                                                        Ver
                                                    </Badge>
                                                )}
                                                {task.status === 'MISSED' && (
                                                    <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/5 px-2 py-0.5 text-[10px]">
                                                        Fallida
                                                    </Badge>
                                                )}
                                                {task.status === 'PENDING' && (
                                                    <Badge variant="secondary" className="bg-white/10 text-gray-400 hover:bg-white/20 px-2 py-0.5 text-[10px]">
                                                        Pendiente
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={!!selectedEvidence} onOpenChange={(open) => !open && setSelectedEvidence(null)}>
                <DialogContent className="bg-[#0a0a0a] border border-white/10 text-white sm:max-w-md p-0 overflow-hidden rounded-3xl shadow-2xl">
                    {selectedEvidence && (
                        <div className="flex flex-col">
                            <div className="bg-black relative aspect-[3/4] w-full shrink-0 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

                                {selectedEvidence.fileUrl.endsWith('.webm') || selectedEvidence.fileUrl.endsWith('.mp4') ? (
                                    <video
                                        src={selectedEvidence.fileUrl}
                                        controls
                                        className="w-full h-full object-cover"
                                        autoPlay
                                    />
                                ) : (
                                    <img
                                        src={selectedEvidence.fileUrl}
                                        alt="Evidencia"
                                        className="w-full h-full object-cover"
                                    />
                                )}

                                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                                    <Badge className="bg-green-500 text-black font-bold mb-3 hover:bg-green-400 transition-colors">
                                        Tarea Completada
                                    </Badge>
                                    <h2 className="text-xl font-bold leading-tight text-white mb-2">{selectedEvidence.title}</h2>
                                    <p className="text-gray-300 text-sm flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(selectedEvidence.submittedAt), "PPP p", { locale: es })}
                                    </p>
                                </div>
                            </div>

                            <div className="p-5 bg-[#111] border-t border-white/10">
                                <div className="flex items-center gap-4">
                                    <Avatar className="w-12 h-12 border-2 border-white/10">
                                        <AvatarImage src={selectedEvidence.completedByPhoto || undefined} />
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                                            <User className="w-5 h-5" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">Realizado por</p>
                                        <p className="text-white font-bold text-lg">{selectedEvidence.completedBy}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

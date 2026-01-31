'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, User } from 'lucide-react';
import { getDailyTaskReport } from '@/actions/processes';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TaskReportItem {
    id: string;
    title: string;
    zoneName: string;
    limitTime: string | null;
    status: 'COMPLETED' | 'PENDING' | 'MISSED';
    assignedStaff?: string | null;
    evidence: {
        fileUrl: string;
        submittedAt: Date;
        completedBy?: string | null;
        completedByPhoto?: string | null;
    } | null;
}

interface ReportData {
    date: string;
    stats: {
        total: number;
        completed: number;
        pending: number;
        missed: number;
    };
    tasks: TaskReportItem[];
}

interface EvidenceView {
    fileUrl: string;
    title: string;
    submittedAt: Date;
    completedBy?: string | null;
    completedByPhoto?: string | null;
}

export default function DailyProcessReport() {
    const [date, setDate] = useState<Date>(new Date());
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedEvidence, setSelectedEvidence] = useState<EvidenceView | null>(null);

    useEffect(() => {
        async function fetchReport() {
            setLoading(true);
            try {
                // Format YYYY-MM-DD
                const dateStr = format(date, 'yyyy-MM-dd');
                const data = await getDailyTaskReport(dateStr);
                setReport(data as any); // Type assertion if needed due to serialization
            } catch (error) {
                console.error("Failed to fetch report", error);
            } finally {
                setLoading(false);
            }
        }

        fetchReport();
    }, [date]);

    return (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-indigo-400" />
                        Reporte Diario de Operaciones
                    </h3>
                    <p className="text-sm text-gray-400">Selecciona una fecha para ver el cumplimiento.</p>
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "w-[240px] pl-3 text-left font-normal bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white",
                                !date && "text-muted-foreground"
                            )}
                        >
                            {date ? (
                                format(date, "PPP", { locale: es })
                            ) : (
                                <span>Selecciona fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#222] border-white/10 text-white" align="end">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(d) => d && setDate(d)}
                            disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {loading ? (
                <div className="h-40 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            ) : report ? (
                <div className="space-y-6">
                    {/* KPI Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                            <p className="text-xs text-slate-400 uppercase font-bold">Total Tareas</p>
                            <p className="text-2xl font-bold text-white">{report.stats.total}</p>
                        </div>
                        <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/10">
                            <p className="text-xs text-green-400 uppercase font-bold">Completadas</p>
                            <p className="text-2xl font-bold text-green-400">{report.stats.completed}</p>
                        </div>
                        <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/10">
                            <p className="text-xs text-yellow-400 uppercase font-bold">Pendientes</p>
                            <p className="text-2xl font-bold text-yellow-400">{report.stats.pending}</p>
                        </div>
                        <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/10">
                            <p className="text-xs text-red-400 uppercase font-bold">No Realizadas</p>
                            <p className="text-2xl font-bold text-red-400">{report.stats.missed}</p>
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="space-y-3">
                        {report.tasks.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">No hay tareas programadas para este día.</p>
                        ) : (
                            report.tasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => {
                                        if (task.status === 'COMPLETED' && task.evidence) {
                                            setSelectedEvidence({
                                                fileUrl: task.evidence.fileUrl,
                                                title: task.title,
                                                submittedAt: task.evidence.submittedAt,
                                                completedBy: task.evidence.completedBy,
                                                completedByPhoto: task.evidence.completedByPhoto
                                            });
                                        }
                                    }}
                                    className={`flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 transition-colors ${task.status === 'COMPLETED' ? 'cursor-pointer hover:bg-white/10' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 p-1.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                            task.status === 'MISSED' ? 'bg-red-500/20 text-red-400' :
                                                'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {task.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4" /> :
                                                task.status === 'MISSED' ? <XCircle className="w-4 h-4" /> :
                                                    <Clock className="w-4 h-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white text-sm">{task.title}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                                <span className="px-1.5 py-0.5 bg-white/10 rounded border border-white/5">{task.zoneName}</span>
                                                {task.limitTime && (
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        Límite: {task.limitTime}
                                                    </span>
                                                )}
                                                {task.evidence && (
                                                    <span className="text-green-400 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {new Date(task.evidence.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                                {task.status === 'MISSED' && task.assignedStaff && (
                                                    <span className="text-red-400 flex items-center gap-1 font-semibold">
                                                        <User className="w-3 h-3" />
                                                        Resp: {task.assignedStaff}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {task.status === 'COMPLETED' ? (
                                        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                                            HECHO
                                        </div>
                                    ) : task.status === 'MISSED' ? (
                                        <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                                            NO HECHO
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
                                            PENDIENTE
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : null}

            <Dialog open={!!selectedEvidence} onOpenChange={(open) => !open && setSelectedEvidence(null)}>
                <DialogContent className="bg-black/90 border border-white/10 text-white max-w-sm w-[90%] rounded-3xl p-0 overflow-hidden backdrop-blur-xl">
                    {selectedEvidence && (
                        <div className="flex flex-col max-h-[85vh]">
                            {/* Evidence View */}
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

                            {/* Details */}
                            <div className="p-6 space-y-4">
                                <div>
                                    <h2 className="text-xl font-bold leading-tight mb-1">{selectedEvidence.title}</h2>
                                    <p className="text-green-400 font-medium text-sm flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Tarea Completada Exitosamente
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                        <Clock className="w-5 h-5 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Hora Registrada</p>
                                            <p className="text-white font-mono">
                                                {format(new Date(selectedEvidence.submittedAt), "PPP p", { locale: es })}
                                            </p>
                                        </div>
                                    </div>

                                    {selectedEvidence.completedBy && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                            <Avatar className="w-10 h-10 border border-white/10">
                                                <AvatarImage src={selectedEvidence.completedByPhoto || undefined} alt={selectedEvidence.completedBy} />
                                                <AvatarFallback className="bg-indigo-500/20 text-indigo-400 font-bold">
                                                    <User className="w-5 h-5" />
                                                </AvatarFallback>
                                            </Avatar>

                                            <div>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Realizado por</p>
                                                <p className="text-white font-bold">
                                                    {selectedEvidence.completedBy}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

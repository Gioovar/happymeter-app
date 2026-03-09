import { getOpsSupervisionTasks } from '@/actions/supervision';
import {
    CheckCircle2,
    Circle,
    Clock,
    MapPin,
    ChevronRight,
    AlertTriangle,
    ShieldCheck,
    UserCircle2
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function OpsSupervisionPage() {
    const tasks = await getOpsSupervisionTasks();

    if (!tasks || tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center p-6 bg-slate-900 border border-slate-800 rounded-3xl mt-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-slate-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Nada por Supervisar</h2>
                <p className="text-slate-400">No hay tareas operativas asignadas para hoy en esta sucursal.</p>
            </div>
        );
    }

    const todayDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1 mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                        <ShieldCheck className="w-4 h-4 text-white" />
                    </div>
                    Supervisión Operativa
                </h1>
                <p className="text-sm text-slate-400 capitalize">{todayDate}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg p-2 space-y-2">
                {tasks.map((task) => {
                    const isDone = task.hasEvidence;

                    // Determine Status Color & Icon
                    let StatusIcon = Circle;
                    let statusColor = "text-slate-500";
                    let bgStatus = "bg-slate-800/20";
                    let borderStatus = "border-transparent";

                    if (task.status === 'APPROVED') {
                        StatusIcon = CheckCircle2;
                        statusColor = "text-emerald-500";
                        bgStatus = "bg-emerald-500/10";
                        borderStatus = "border-emerald-500/20";
                    } else if (task.status === 'REJECTED') {
                        StatusIcon = AlertTriangle;
                        statusColor = "text-rose-500";
                        bgStatus = "bg-rose-500/10";
                        borderStatus = "border-rose-500/20";
                    } else if (task.status === 'REVIEW') {
                        StatusIcon = Clock;
                        statusColor = "text-amber-500";
                        bgStatus = "bg-amber-500/10";
                        borderStatus = "border-amber-500/20";
                    }

                    return (
                        <Link
                            href={`/ops/supervision/task/${task.taskId}${task.evidenceId ? `?evidenceId=${task.evidenceId}` : ''}`}
                            key={task.taskId}
                            className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all active:scale-[0.98] cursor-pointer hover:bg-slate-800 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-900/10 overflow-hidden ${bgStatus} ${borderStatus}`}
                        >
                            {/* Subtle Blue Glow on Hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <StatusIcon className={`w-6 h-6 shrink-0 mt-0.5 ${statusColor}`} />

                            <div className="flex-1 min-w-0">
                                <h4 className="text-[15px] font-bold text-white truncate">{task.title}</h4>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                                    <MapPin className="w-3.5 h-3.5 text-indigo-400/70" /> {task.zoneName}
                                </p>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                                        <UserCircle2 className="w-3.5 h-3.5 opacity-70" />
                                        <span className="truncate max-w-[120px]">{task.assignedStaffName}</span>
                                    </div>

                                    {task.limitTime && (
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                            <Clock className="w-3 h-3 text-slate-500" />
                                            {task.limitTime}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 ml-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${task.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                    task.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                                        task.status === 'REVIEW' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-slate-800 text-slate-400'
                                    }`}>
                                    {task.status === 'REVIEW' ? 'Por Revisar' :
                                        task.status === 'APPROVED' ? 'Aprobada' :
                                            task.status === 'REJECTED' ? 'Rechazada' : 'Pendiente'}
                                </span>
                                <ChevronRight className="w-5 h-5 text-slate-600 mt-1" />
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}

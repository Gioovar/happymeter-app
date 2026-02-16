import { getOpsTasks } from '@/actions/processes';
import {
    CheckCircle2,
    Circle,
    Clock,
    MapPin,
    ChevronRight,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default async function OpsTasksPage() {
    const data = await getOpsTasks();

    if (!data || !data.zones.length) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center p-6">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-slate-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Sin Tareas Asignadas</h2>
                <p className="text-slate-400">No tienes zonas ni tareas configuradas para hoy.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white mb-6">Tareas de Hoy</h1>

            {data.zones.map((zone) => (
                <div key={zone.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="bg-slate-800/50 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-400" />
                            {zone.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">
                            {zone.tasks.filter(t => t.evidences.length > 0).length}/{zone.tasks.length}
                        </span>
                    </div>

                    <div className="divide-y divide-slate-800">
                        {zone.tasks.map((task) => {
                            const lastEvidence = task.evidences[0];
                            const isDone = !!lastEvidence;
                            const isLate = lastEvidence?.status === 'DELAYED';

                            // Determine status color/icon
                            let StatusIcon = Circle;
                            let statusColor = "text-slate-500";

                            if (isDone) {
                                StatusIcon = CheckCircle2;
                                statusColor = isLate ? "text-amber-500" : "text-emerald-500";
                            }

                            return (
                                <Link
                                    href={isDone ? '#' : `/ops/tasks/${task.id}`}
                                    key={task.id}
                                    className={`flex items-center gap-4 p-4 transition-colors ${isDone ? 'opacity-60 cursor-default' : 'hover:bg-slate-800 active:bg-slate-800'}`}
                                >
                                    <StatusIcon className={`w-6 h-6 shrink-0 ${statusColor}`} />

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-white truncate">{task.title}</h4>
                                        {task.description && (
                                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-tight">
                                                {task.description}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                            {task.limitTime && (
                                                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" />
                                                    Límite: {task.limitTime}
                                                </p>
                                            )}
                                            {isLate && (
                                                <p className="text-[10px] text-amber-500 flex items-center gap-1">
                                                    <AlertTriangle className="w-2.5 h-2.5" />
                                                    Atrasado
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {!isDone && (
                                        <ChevronRight className="w-5 h-5 text-slate-600" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

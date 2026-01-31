import { getStaffTasks } from '@/actions/supervision';
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button'; // Assuming shadcn attached
import { notFound } from 'next/navigation';

export default async function EmployeeSupervisionPage({ params }: { params: { staffId: string } }) {
    const data = await getStaffTasks(params.staffId);

    if (!data) return notFound();

    const { member, tasks } = data;

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/supervision" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">{member.name}</h1>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                        {member.role === 'OPERATOR' ? 'Operador' : member.role}
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        {tasks.length} Tareas Asignadas hoy
                    </p>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
                {tasks.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl bg-white/5 border border-dashed border-white/10">
                        <p className="text-gray-400">Sin tareas programadas para hoy.</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.taskId}
                            className="bg-[#111] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-violet-500/30 group"
                        >
                            {/* Left: Info */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-medium">{task.taskTitle}</h3>
                                    {task.limitTime && (
                                        <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {task.limitTime}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">{task.zoneName}</p>
                            </div>

                            {/* Middle: Status */}
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

                                    {task.status === 'APPROVED' ? 'APROBADA' :
                                        task.status === 'REJECTED' ? 'RECHAZADA' :
                                            task.status === 'REVIEW' ? 'POR REVISAR' :
                                                'PENDIENTE'}
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-2">
                                {task.status === 'REVIEW' || task.status === 'APPROVED' || task.status === 'REJECTED' ? (
                                    <Link
                                        href={`/dashboard/supervision/task/${task.taskId}?evidenceId=${task.evidenceId}`}
                                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-violet-900/20"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Revisar Evidencia
                                    </Link>
                                ) : (
                                    <button disabled className="text-gray-600 px-4 py-2 text-sm font-medium cursor-not-allowed">
                                        Sin Entregar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

import { getOpsTaskDetails, validateEvidence } from '@/actions/supervision';
import { ValidationButtons } from '@/components/supervision/ValidationButtons';
import { ArrowLeft, Clock, Calendar, CheckCircle2, XCircle, UserCircle2 } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';
import { getTaskChat } from '@/actions/task-chat';
import TaskChat from '@/components/supervision/TaskChat';
import { getOpsSession } from '@/lib/ops-auth';

export default async function OpsTaskDetailPage({ params, searchParams }: { params: { taskId: string }, searchParams: { evidenceId?: string } }) {
    const session = await getOpsSession();
    if (!session.isAuthenticated) return redirect('/ops/login');

    const data = await getOpsTaskDetails(params.taskId, searchParams.evidenceId);

    if (!data) return notFound();

    const { task, currentEvidence, history } = data;
    const chatData = await getTaskChat(params.taskId);

    // Determine the current user's ID for the chat (member ID if offline staff acting as supervisor, or userId for owner)
    const currentUserId = session.member?.id || session.userId;

    async function handleValidation(formData: FormData) {
        'use server';
        const status = formData.get('status') as 'APPROVED' | 'REJECTED';
        const note = formData.get('note') as string;
        if (!currentEvidence) return;

        await validateEvidence(currentEvidence.id, status, note);
        revalidatePath(`/ops/supervision/task/${task.id}`);
        revalidatePath(`/ops/supervision`);
    }

    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-md">
                <Link href={`/ops/supervision`} className="p-2 bg-slate-800/50 rounded-xl hover:bg-slate-700 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-300" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-white truncate">{task.title}</h1>
                    <p className="text-slate-400 text-xs truncate">{task.zoneName}</p>
                </div>
            </div>

            {/* Task Info & Assignment */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3 bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                        <UserCircle2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Asignado a</p>
                        <p className="text-sm text-white font-bold">{task.assignedStaffName}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/20 rounded-2xl p-3 border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-wider">Hora Límite</span>
                        <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            {task.limitTime || "N/A"}
                        </div>
                    </div>
                    <div className="bg-slate-800/20 rounded-2xl p-3 border border-slate-800/50">
                        <span className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-wider">Frecuencia</span>
                        <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                            <Calendar className="w-4 h-4 text-indigo-400" />
                            <span className="truncate">{task.days.join(', ')}</span>
                        </div>
                    </div>
                </div>

                {task.description && (
                    <div className="pt-2 border-t border-slate-800/50">
                        <span className="text-[10px] text-slate-500 block mb-1 uppercase font-bold tracking-wider">Instrucciones</span>
                        <p className="text-slate-300 text-sm leading-relaxed">{task.description}</p>
                    </div>
                )}
            </div>

            {/* Evidence Viewer */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-md">
                <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                    <h3 className="text-sm font-bold text-white">Evidencia Enviada</h3>
                </div>

                <div className="relative min-h-[300px] flex items-center justify-center bg-black">
                    {currentEvidence ? (
                        currentEvidence.fileUrl.endsWith('.mp4') || currentEvidence.fileUrl.endsWith('.webm') ? (
                            <video controls className="w-full h-auto max-h-[500px]" src={currentEvidence.fileUrl} />
                        ) : (
                            <div className="relative w-full aspect-square max-h-[500px]">
                                <Image
                                    src={currentEvidence.fileUrl}
                                    alt="Evidence"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )
                    ) : (
                        <div className="text-center p-10 flex flex-col items-center justify-center">
                            <XCircle className="w-12 h-12 text-slate-700 mb-3" />
                            <p className="text-slate-500 text-sm font-medium">No se ha enviado evidencia aún.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Validation Form */}
            {currentEvidence && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-md">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                        Validación / Calificación
                    </h3>

                    {currentEvidence.validationStatus === 'PENDING' || currentEvidence.validationStatus === 'REVIEW' ? (
                        <form action={handleValidation} className="space-y-4">
                            <div>
                                <label className="block text-[11px] uppercase font-bold tracking-wider text-slate-500 mb-2">Retroalimentación o corrección (Opcional)</label>
                                <textarea
                                    name="note"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-24 text-sm"
                                    placeholder="Instrucciones para mejorar..."
                                />
                            </div>
                            <ValidationButtons variant="ops" />
                        </form>
                    ) : (
                        <div className={`p-4 rounded-2xl border ${currentEvidence.validationStatus === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                {currentEvidence.validationStatus === 'APPROVED' ?
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                                    <XCircle className="w-5 h-5 text-rose-400" />
                                }
                                <span className={`font-bold text-sm ${currentEvidence.validationStatus === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {currentEvidence.validationStatus === 'APPROVED' ? 'TAREA APROBADA' : 'TAREA RECHAZADA'}
                                </span>
                            </div>
                            {currentEvidence.supervisorNote && (
                                <p className="text-slate-300 text-sm mt-3 p-3 bg-black/20 rounded-xl italic border border-white/5">
                                    "{currentEvidence.supervisorNote}"
                                </p>
                            )}
                            <p className="text-[10px] text-slate-500 mt-3 font-mono">
                                Validado el {new Date(currentEvidence.validatedAt!).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Task In-App Chat */}
            <div className="pt-4">
                <TaskChat
                    taskId={task.id}
                    initialMessages={chatData?.messages || []}
                    currentUserId={currentUserId as string}
                    role="SUPERVISOR"
                />
            </div>
        </div>
    );
}

import { getTaskDetails, validateEvidence } from '@/actions/supervision';
import AIAnalysisPanel from '@/components/supervision/AIAnalysisPanel';
import { ArrowLeft, Clock, Calendar, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { revalidatePath } from 'next/cache';

export default async function TaskDetailPage({ params, searchParams }: { params: { taskId: string }, searchParams: { evidenceId?: string } }) {
    const data = await getTaskDetails(params.taskId, searchParams.evidenceId);

    if (!data) return notFound();

    const { task, currentEvidence, history } = data;

    async function handleValidation(formData: FormData) {
        'use server';
        const status = formData.get('status') as 'APPROVED' | 'REJECTED';
        const note = formData.get('note') as string;
        if (!currentEvidence) return;

        await validateEvidence(currentEvidence.id, status, note);
        revalidatePath(`/dashboard/supervision/task/${task.id}`);
        revalidatePath(`/dashboard/supervision`);
    }

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Evidence & Validation */}
            <div className="lg:col-span-2 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <Link href="/dashboard/supervision" className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">{task.title}</h1>
                        <p className="text-gray-400 text-sm">{task.zoneName}</p>
                    </div>
                </div>

                {/* Evidence Viewer */}
                <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden min-h-[400px] relative flex items-center justify-center bg-black/50">
                    {currentEvidence ? (
                        currentEvidence.fileUrl.endsWith('.mp4') || currentEvidence.fileUrl.endsWith('.webm') ? (
                            <video controls className="w-full h-auto max-h-[600px]" src={currentEvidence.fileUrl} />
                        ) : (
                            <div className="relative w-full h-[500px]">
                                <Image
                                    src={currentEvidence.fileUrl}
                                    alt="Evidence"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        )
                    ) : (
                        <div className="text-center p-10">
                            <p className="text-gray-500">No hay evidencia seleccionada.</p>
                        </div>
                    )}
                </div>

                {/* Validation Console with AI */}
                {currentEvidence && (
                    <div className="space-y-6">
                        <AIAnalysisPanel
                            evidenceId={currentEvidence.id}
                            existingAnalysis={currentEvidence.aiAnalysis}
                        />

                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-violet-500" />
                                Validación
                            </h3>

                            {currentEvidence.validationStatus === 'PENDING' || currentEvidence.validationStatus === 'REVIEW' ? (
                                <form action={handleValidation} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Comentario (Opcional)</label>
                                        <textarea
                                            name="note"
                                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-violet-500 outline-none resize-none h-24"
                                            placeholder="Escribe una observación para el empleado..."
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            type="submit"
                                            name="status"
                                            value="APPROVED"
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Aprobar Tarea
                                        </button>
                                        <button
                                            type="submit"
                                            name="status"
                                            value="REJECTED"
                                            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            Rechazar
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className={`p-4 rounded-xl border ${currentEvidence.validationStatus === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                        'bg-red-500/10 border-red-500/20'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {currentEvidence.validationStatus === 'APPROVED' ?
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        }
                                        <span className={`font-bold ${currentEvidence.validationStatus === 'APPROVED' ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                            {currentEvidence.validationStatus === 'APPROVED' ? 'TAREA APROBADA' : 'TAREA RECHAZADA'}
                                        </span>
                                    </div>
                                    {currentEvidence.supervisorNote && (
                                        <p className="text-gray-300 text-sm mt-2 italic">
                                            "{currentEvidence.supervisorNote}"
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        Validado el {new Date(currentEvidence.validatedAt!).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right Column: Info & History */}
            <div className="space-y-6">
                {/* Task Info */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4">Detalles</h3>
                    <div className="space-y-4">
                        <div>
                            <span className="text-xs text-gray-500 block mb-1">Descripción</span>
                            <p className="text-gray-300 text-sm">{task.description || "Sin descripción"}</p>
                        </div>
                        <div className="flex justify-between">
                            <div>
                                <span className="text-xs text-gray-500 block mb-1">Hora Límite</span>
                                <div className="flex items-center gap-1 text-white text-sm">
                                    <Clock className="w-4 h-4 text-violet-500" />
                                    {task.limitTime || "N/A"}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block mb-1">Frecuencia</span>
                                <div className="flex items-center gap-1 text-white text-sm">
                                    <Calendar className="w-4 h-4 text-violet-500" />
                                    {task.days.join(', ')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4">Historial</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {history.map((ev) => (
                            <Link
                                href={`?evidenceId=${ev.id}`}
                                key={ev.id}
                                className={`block p-3 rounded-xl border transition-all ${currentEvidence?.id === ev.id
                                        ? 'bg-violet-600/10 border-violet-500/50'
                                        : 'bg-white/5 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-xs text-gray-400">
                                        {new Date(ev.submittedAt).toLocaleDateString()}
                                    </span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ev.validationStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                            ev.validationStatus === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                                                'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {ev.validationStatus}
                                    </span>
                                </div>
                                <div className="text-sm text-white font-medium flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-gray-500" />
                                    {new Date(ev.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {ev.comments && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">"{ev.comments}"</p>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

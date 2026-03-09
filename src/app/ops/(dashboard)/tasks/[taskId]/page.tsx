import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getOpsSession } from '@/lib/ops-auth';
import TaskCaptureClient from './TaskCaptureClient';
import { getMexicoTodayRange } from '@/actions/processes';
import { getTaskChat } from '@/actions/task-chat';
import TaskChat from '@/components/supervision/TaskChat';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Image from 'next/image';

export default async function TaskCapturePage({ params }: { params: { taskId: string } }) {
    const session = await getOpsSession();
    if (!session.isAuthenticated) return redirect('/ops/login');

    const { start: todayStart, end: todayEnd } = await getMexicoTodayRange();

    const task = await prisma.processTask.findUnique({
        where: { id: params.taskId },
        select: {
            id: true,
            title: true,
            description: true,
            evidenceType: true,
            evidences: {
                where: {
                    submittedAt: {
                        gte: todayStart,
                        lte: todayEnd
                    }
                },
                orderBy: { submittedAt: 'desc' },
                take: 1
            }
        }
    });

    if (!task) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Tarea no encontrada.
            </div>
        );
    }

    const currentEvidence = task.evidences[0];

    // IF NO EVIDENCE -> Show Capture UI
    if (!currentEvidence) {
        return <TaskCaptureClient task={task} />;
    }

    // IF COMPLETED -> Show Review & Chat UI
    const chatData = await getTaskChat(params.taskId);
    const currentUserId = session.member?.id || session.userId;

    return (
        <div className="flex flex-col min-h-screen bg-black pb-12">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-4 bg-black/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                <Link href="/ops/tasks" className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-white truncate">{task.title}</h1>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${currentEvidence.validationStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                            currentEvidence.validationStatus === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' :
                                'bg-amber-500/20 text-amber-400'
                        }`}>
                        {currentEvidence.validationStatus === 'REVIEW' ? 'En Revisión' : currentEvidence.validationStatus}
                    </span>
                </div>
            </header>

            <div className="p-4 space-y-6">
                {/* Evidence Viewer */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-md">
                    <div className="relative min-h-[300px] flex items-center justify-center bg-black">
                        {currentEvidence.fileUrl.endsWith('.mp4') || currentEvidence.fileUrl.endsWith('.webm') ? (
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
                        )}
                    </div>
                </div>

                {/* Supervisor Feedback */}
                {currentEvidence.supervisorNote && (
                    <div className={`p-4 rounded-2xl border ${currentEvidence.validationStatus === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            {currentEvidence.validationStatus === 'APPROVED' ?
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                                <XCircle className="w-5 h-5 text-rose-400" />
                            }
                            <span className={`font-bold text-sm ${currentEvidence.validationStatus === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                Comentarios del Supervisor
                            </span>
                        </div>
                        <p className="text-slate-300 text-sm mt-3 p-3 bg-black/20 rounded-xl italic border border-white/5">
                            "{currentEvidence.supervisorNote}"
                        </p>
                        <p className="text-[10px] text-slate-500 mt-3 font-mono">
                            Validado el {new Date(currentEvidence.validatedAt!).toLocaleString()}
                        </p>
                    </div>
                )}

                {/* Chat */}
                <div>
                    <TaskChat
                        taskId={task.id}
                        initialMessages={chatData?.messages || []}
                        currentUserId={currentUserId as string}
                        role="STAFF"
                    />
                </div>
            </div>
        </div>
    );
}

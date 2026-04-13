'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, MessageSquare, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { validateEvidence } from '@/actions/supervision';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface ValidationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    task: {
        id: string;
        title: string;
        zoneName: string;
    } | null;
    evidence: {
        id: string;
        fileUrl: string;
        submittedAt: Date | string;
        comments?: string | null;
        validationStatus?: string;
        supervisorNote?: string | null;
    } | null;
    onSuccess?: () => void;
}

export default function ValidationDialog({ isOpen, onClose, task, evidence, onSuccess }: ValidationDialogProps) {
    const [note, setNote] = useState(evidence?.supervisorNote || '');
    const [isValidating, setIsValidating] = useState(false);

    if (!task || !evidence) return null;

    const handleValidate = async (status: 'APPROVED' | 'REJECTED') => {
        setIsValidating(true);
        try {
            const res = await validateEvidence(evidence.id, status, note);
            if (res.success) {
                toast.success(status === 'APPROVED' ? 'Tarea aprobada' : 'Tarea rechazada');
                onSuccess?.();
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al validar evidencia');
        } finally {
            setIsValidating(false);
        }
    };

    const isVideo = evidence.fileUrl.endsWith('.mp4') || evidence.fileUrl.endsWith('.webm');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-lg w-[95%] rounded-3xl p-0 overflow-hidden shadow-2xl">
                <div className="flex flex-col h-full max-h-[90vh]">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-500/5 mb-1 text-[10px] h-5">
                                    {task.zoneName}
                                </Badge>
                                <DialogTitle className="text-xl font-bold">{task.title}</DialogTitle>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Enviado {format(new Date(evidence.submittedAt), "PPP p", { locale: es })}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 -mt-2 -mr-2">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Evidence Media */}
                        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 group">
                            {isVideo ? (
                                <video src={evidence.fileUrl} controls className="w-full h-full object-contain" />
                            ) : (
                                <img src={evidence.fileUrl} alt="Evidence" className="w-full h-full object-contain" />
                            )}
                        </div>

                        {/* Staff Comment */}
                        {evidence.comments && (
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Nota del Staff</span>
                                    <p className="text-sm text-gray-300 mt-1 italic">"{evidence.comments}"</p>
                                </div>
                            </div>
                        )}

                        {/* Validation Input */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" />
                                    Nota de Supervisión
                                </span>
                                <span className="text-[10px] text-gray-500 italic">Opcional al aprobar, obligatorio al rechazar</span>
                            </div>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Escribe aquí tus observaciones..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 min-h-[100px] resize-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-white/5">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                onClick={() => handleValidate('REJECTED')}
                                disabled={isValidating || !note.trim()}
                                className="h-12 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 gap-2 font-bold"
                            >
                                <XCircle className="w-4 h-4" />
                                Rechazar
                            </Button>
                            <Button
                                onClick={() => handleValidate('APPROVED')}
                                disabled={isValidating}
                                className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white gap-2 font-bold shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Aprobar Tarea
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

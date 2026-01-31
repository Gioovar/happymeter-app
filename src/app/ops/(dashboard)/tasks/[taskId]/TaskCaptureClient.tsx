'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TaskCamera from '@/components/ops/TaskCamera';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { submitTaskEvidence } from '@/actions/processes';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ProcessTask } from '@prisma/client';

interface TaskCaptureClientProps {
    task: {
        id: string;
        title: string;
        evidenceType: 'PHOTO' | 'VIDEO' | 'BOTH';
    }
}

export default function TaskCaptureClient({ task }: TaskCaptureClientProps) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);

    const handleCapture = async (file: File, meta: { lat: number, lng: number, capturedAt: Date, type: 'PHOTO' | 'VIDEO' }) => {
        setIsUploading(true);
        try {
            // 1. Upload File to Supabase
            // Use different folders or extensions based on type if needed, but 'evidence' bucket is fine.
            const ext = file.type.split('/')[1] || 'jpg';
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

            const { data, error } = await supabase.storage
                .from('evidence')
                .upload(fileName, file);

            if (error) throw error;

            const publicUrl = supabase.storage
                .from('evidence')
                .getPublicUrl(fileName).data.publicUrl;

            // 2. Submit Evidence
            await submitTaskEvidence({
                taskId: task.id,
                fileUrl: publicUrl,
                capturedAt: meta.capturedAt,
            });

            toast.success("Evidencia enviada correctamente");

            // If "BOTH" maybe we should check if they need to upload the other one?
            // For now, let's assume one is enough or they can enter again.
            // But realistically for "BOTH" they might want to upload two. 
            // The user complaint was "It only asked for Photo". Now they can choose.

            router.push('/ops/tasks');
            router.refresh();

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al enviar evidencia");
        } finally {
            setIsUploading(false);
        }
    };

    if (isUploading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <UploadCloud className="w-12 h-12 animate-bounce text-indigo-500 mb-4" />
                <h2 className="text-xl font-bold">Subiendo Evidencia...</h2>
                <p className="text-gray-400">Por favor espera un momento.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-4">
                <Link href="/ops/tasks" className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-white">{task.title}</h1>
                    <p className="text-xs text-gray-400">
                        {task.evidenceType === 'BOTH' ? 'Sube Foto o Video' :
                            task.evidenceType === 'VIDEO' ? 'Graba un Video' : 'toma una Foto'}
                    </p>
                </div>
            </header>

            {/* Camera Area */}
            <main className="flex-1 p-4 flex flex-col justify-center">
                <TaskCamera
                    onCapture={handleCapture}
                    evidenceType={task.evidenceType}
                />
            </main>
        </div>
    );
}

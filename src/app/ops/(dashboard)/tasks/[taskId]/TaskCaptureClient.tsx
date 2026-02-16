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
        description?: string | null;
        evidenceType: 'PHOTO' | 'VIDEO' | 'BOTH';
    }
}

export default function TaskCaptureClient({ task }: TaskCaptureClientProps) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const handleCapture = async (file: File, meta: { lat: number, lng: number, capturedAt: Date, type: 'PHOTO' | 'VIDEO', comments?: string }) => {
        setIsUploading(true);
        setUploadProgress(0);
        try {
            let publicUrl = '';

            if (meta.type === 'PHOTO') {
                // Use robust image processing (HEIC -> JPG, Compress -> Vercel Blob)
                const { processAndUploadImage } = await import('@/lib/image-processing');
                const result = await processAndUploadImage(file, (progress) => {
                    setUploadProgress(Math.round(progress));
                });
                publicUrl = result.url;
            } else {
                // Video: Keep using Supabase for now (handling large files)
                const ext = file.type.split('/')[1] || 'webm';
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

                const { data, error } = await supabase.storage
                    .from('evidence')
                    .upload(fileName, file);

                if (error) throw error;

                publicUrl = supabase.storage
                    .from('evidence')
                    .getPublicUrl(fileName).data.publicUrl;
            }

            // 2. Submit Evidence
            await submitTaskEvidence({
                taskId: task.id,
                fileUrl: publicUrl,
                capturedAt: meta.capturedAt,
                comments: meta.comments,
                latitude: meta.lat || undefined,
                longitude: meta.lng || undefined,
            });

            toast.success("Evidencia enviada correctamente");

            router.push('/ops/tasks');
            router.refresh();

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al enviar evidencia");
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    if (isUploading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <UploadCloud className="w-12 h-12 animate-bounce text-indigo-500 mb-4" />
                <h2 className="text-xl font-bold">Subiendo Evidencia... {uploadProgress > 0 && `${uploadProgress}%`}</h2>
                <p className="text-gray-400">
                    {uploadProgress > 0 && uploadProgress < 100 ? 'Procesando y optimizando...' : 'Por favor espera un momento.'}
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-black">
            {/* Header */}
            <header className="px-4 py-4 flex items-center gap-4 bg-black/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                <Link href="/ops/tasks" className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-white truncate">{task.title}</h1>
                    {task.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">
                            {task.description}
                        </p>
                    )}
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">
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

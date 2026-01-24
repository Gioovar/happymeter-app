'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TaskCamera from '@/components/ops/TaskCamera';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { submitTaskEvidence } from '@/actions/processes';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function TaskCapturePage({ params }: { params: { taskId: string } }) {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);

    // We fetch task details via server component usually, but for hybrid page let's assume we pass data or fetch
    // actually this is a client component proper, we should likely wrap. 
    // But let's build the UI first.

    const handleCapture = async (file: File, meta: { lat: number, lng: number, capturedAt: Date }) => {
        setIsUploading(true);
        try {
            // 1. Upload File to Supabase
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const { data, error } = await supabase.storage
                .from('evidence')
                .upload(fileName, file);

            if (error) throw error;

            const publicUrl = supabase.storage
                .from('evidence')
                .getPublicUrl(fileName).data.publicUrl;

            // 2. Submit Evidence
            await submitTaskEvidence({
                taskId: params.taskId,
                fileUrl: publicUrl,
                capturedAt: meta.capturedAt,
            });

            toast.success("Evidencia enviada correctamente");
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
                    <h1 className="text-lg font-bold text-white">Capturar Evidencia</h1>
                    <p className="text-xs text-gray-400">Asegúrate de mostrar los detalles clave</p>
                </div>
            </header>

            {/* Camera Area */}
            <main className="flex-1 p-4 flex flex-col justify-center">
                <TaskCamera onCapture={handleCapture} evidenceType="PHOTO" />
            </main>
        </div>
    );
}

import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import TaskCaptureClient from './TaskCaptureClient';

export default async function TaskCapturePage({ params }: { params: { taskId: string } }) {
    const { userId } = await auth();
    if (!userId) redirect('/ops/login');

    const task = await prisma.processTask.findUnique({
        where: { id: params.taskId },
        select: {
            id: true,
            title: true,
            evidenceType: true
        }
    });

    if (!task) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Tarea no encontrada.
            </div>
        );
    }

    return <TaskCaptureClient task={task} />;
}

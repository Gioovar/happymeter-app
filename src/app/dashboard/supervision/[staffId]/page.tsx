import { getStaffTasks } from '@/actions/supervision';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TaskItemCard } from '@/components/supervision/TaskItemCard';

import { getActiveBusinessId } from '@/lib/tenant';

export default async function GlobalEmployeeSupervisionPage({ params }: { params: { staffId: string } }) {
    const effectiveUserId = await getActiveBusinessId();
    if (!effectiveUserId) return notFound();

    const data = await getStaffTasks(params.staffId, effectiveUserId);

    if (!data) return notFound();

    const { member, tasks } = data;

    return (
        <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/supervision`} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
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
                        <TaskItemCard key={task.taskId} task={task} employee={member} mode="employee" />
                    ))
                )}
            </div>
        </div>
    );
}

'use client'

import { AlertCircle, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TaskItemCard } from '@/components/supervision/TaskItemCard'

interface IssuesViewProps {
    issues: any[]
}

export default function IssuesView({ issues }: IssuesViewProps) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    Incidencias
                </h1>
                <p className="text-gray-400 mt-1">Reporte de retrasos y problemas operativos.</p>
            </div>

            <div className="grid gap-4">
                {issues.length === 0 ? (
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">¡Todo en orden!</h3>
                        <p className="text-gray-400">No hay incidencias reportadas recientemente.</p>
                    </div>
                ) : (
                    issues.map((issue) => {
                        const staff = issue.task.assignedStaff || issue.task.zone?.assignedStaff;
                        const employee = {
                            name: staff?.user?.fullName || staff?.name || 'Sin Asignar',
                            role: staff?.role || 'Desconocido',
                            phone: staff?.user?.phone || null
                        };

                        const taskMapped = {
                            taskId: issue.task.id,
                            taskTitle: issue.task.title,
                            limitTime: issue.task.limitTime,
                            zoneName: issue.task.zone?.name || 'Asignación Directa',
                            evidenceType: issue.task.evidenceType,
                            status: 'DELAYED',
                            evidenceId: issue.id,
                            evidenceUrl: issue.fileUrl,
                            submittedAt: issue.submittedAt
                        };

                        return (
                            <TaskItemCard
                                key={issue.id}
                                task={taskMapped}
                                employee={employee}
                                mode="issue"
                            />
                        );
                    })
                )}
            </div>
        </div>
    )
}

import { CheckCircle2 } from 'lucide-react'

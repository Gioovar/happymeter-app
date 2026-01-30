'use client'

import { GitMerge, MapPin, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ActiveFlowsViewProps {
    zones: any[]
}

export default function ActiveFlowsView({ zones }: ActiveFlowsViewProps) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <GitMerge className="w-8 h-8 text-cyan-400" />
                    Flujos Activos
                </h1>
                <p className="text-gray-400 mt-1">Monitorea y gestiona los procesos operativos en tiempo real.</p>
            </div>

            {zones.length === 0 ? (
                <div className="bg-[#111] border border-white/10 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GitMerge className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No hay flujos activos</h3>
                    <p className="text-gray-400">Configura tus zonas y procesos para verlos aquí.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {zones.map((zone) => (
                        <div key={zone.id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-cyan-400" />
                                        {zone.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm mt-1">{zone.description || 'Sin descripción'}</p>
                                </div>
                                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                                    {zone.tasks?.length || 0} Tareas
                                </Badge>
                            </div>

                            <div className="space-y-3">
                                {zone.tasks?.map((task: any) => (
                                    <div key={task.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-cyan-900/20 flex items-center justify-center text-cyan-400">
                                                {task.limitTime ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{task.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                    {task.limitTime && (
                                                        <span className="flex items-center gap-1 text-orange-400">
                                                            <AlertCircle className="w-3 h-3" />
                                                            Límite: {task.limitTime}
                                                        </span>
                                                    )}
                                                    <span>•</span>
                                                    <span>{task.frequency || 'Diario'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!zone.tasks || zone.tasks.length === 0) && (
                                    <p className="text-sm text-center text-gray-500 py-4 italic">Esta zona no tiene tareas asignadas.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

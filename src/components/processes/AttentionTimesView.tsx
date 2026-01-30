'use client'

import { Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AttentionTimesViewProps {
    evidences: any[]
}

export default function AttentionTimesView({ evidences }: AttentionTimesViewProps) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Clock className="w-8 h-8 text-cyan-400" />
                    Tiempos de Atención
                </h1>
                <p className="text-gray-400 mt-1">Historial de cumplimiento y puntualidad en tareas.</p>
            </div>

            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">Registro de Actividad</h3>
                </div>

                {evidences.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay registros de actividad aún.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {evidences.map((evidence) => (
                            <div key={evidence.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${evidence.status === 'ON_TIME'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-orange-500/20 text-orange-400'
                                        }`}>
                                        {evidence.status === 'ON_TIME' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{evidence.task.title}</h4>
                                        <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(evidence.submittedAt), "d MMM yyyy, HH:mm", { locale: es })}
                                            <span className="text-white/20">•</span>
                                            <span>Zona: {evidence.task.zone.name}</span>
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <Badge variant="outline" className={`
                                        ${evidence.status === 'ON_TIME'
                                            ? 'border-green-500/30 text-green-400'
                                            : 'border-orange-500/30 text-orange-400'}
                                    `}>
                                        {evidence.status === 'ON_TIME' ? 'A Tiempo' : 'Retrasado'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

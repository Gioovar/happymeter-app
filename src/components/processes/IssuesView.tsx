'use client'

import { AlertCircle, Clock, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
                    issues.map((issue) => (
                        <div key={issue.id} className="bg-[#111] border border-red-500/20 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-red-500/40 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">{issue.task.title}</h4>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-2">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {issue.task.zone.name}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {format(new Date(issue.submittedAt), "d MMM, HH:mm", { locale: es })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {issue.task.limitTime && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Límite</p>
                                        <p className="font-mono text-white">{issue.task.limitTime}</p>
                                    </div>
                                )}
                                <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                                    Retrasado
                                </Badge>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

import { CheckCircle2 } from 'lucide-react'

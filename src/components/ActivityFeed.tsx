'use client'

import { useEffect, useState, useRef } from 'react'
import { Activity, Circle, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

const MOCK_ACTIVITIES = [
    { type: 'success', message: 'Nueva respuesta de 5 estrellas en "Satisfacción Cliente"', time: 'Ahora' },
    { type: 'info', message: 'Campaña "Verano 2025" activada automáticamente', time: 'hace 2 min' },
    { type: 'warning', message: 'Tasa de rebote aumentó un 2% en la última hora', time: 'hace 15 min' },
    { type: 'success', message: 'Usuario @juanperez completó el onboarding', time: 'hace 32 min' },
    { type: 'info', message: 'Backup del sistema realizado correctamente', time: 'hace 1h' },
]

export default function ActivityFeed() {
    return (
        <div className="rounded-2xl bg-[#0F0F0F] border border-white/5 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="font-bold text-gray-300 flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 text-violet-500" />
                    Actividad en Tiempo Real
                </h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] text-green-500 font-mono tracking-wider">LIVE</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
                <div className="flex flex-col">
                    {MOCK_ACTIVITIES.map((activity, i) => (
                        <div key={i} className="flex gap-3 p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <div className="mt-0.5">
                                {activity.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500/80" />}
                                {activity.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500/80" />}
                                {activity.type === 'info' && <Clock className="w-4 h-4 text-blue-500/80" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-300 leading-relaxed group-hover:text-white transition-colors">
                                    {activity.message}
                                </p>
                                <span className="text-[10px] text-gray-600 font-mono mt-1 block">{activity.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-2 border-t border-white/5 text-center">
                <button className="text-[10px] text-gray-500 hover:text-white transition uppercase font-bold tracking-widest">
                    Ver Historial Completo
                </button>
            </div>
        </div>
    )
}

'use client'

import { Lightbulb, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function ManagementSuggestions() {
    const [isOpen, setIsOpen] = useState(true)

    const suggestions = [
        {
            category: "Operativo",
            items: [
                "Control de Inventario y Stock (Ingredientes)",
                "Gestión de Proveedores y Compras",
                "Control de Turnos de Empleados (Clock-in/out)"
            ]
        },
        {
            category: "Financiero",
            items: [
                "Gastos Categorizados (Renta, Servicios)",
                "Nómina de Empleados (Deducciones, IMSS)",
                "Facturación Automática a Clientes"
            ]
        },
        {
            category: "Marketing",
            items: [
                "Programa de Lealtad (Puntos por visita)",
                "Campañas de Email Automáticas"
            ]
        }
    ]

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#111] hover:bg-white/5 transition-colors group"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Ver sugerencias de "Gestión Total"</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white" />
            </button>
        )
    }

    return (
        <div className="rounded-2xl border border-yellow-500/20 bg-[#111] overflow-hidden mb-8 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/50 to-yellow-500/0" />

            <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                            <Lightbulb className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Roadmap hacia "Gestión Total"</h3>
                            <p className="text-sm text-gray-400 mt-1 max-w-2xl">
                                Para convertir este dashboard en un ERP completo (Nivel Dios), el sistema ha detectado que faltan los siguientes módulos:
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-500 hover:text-white text-sm underline"
                    >
                        Ocultar
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {suggestions.map((cat, i) => (
                        <div key={i} className="space-y-3">
                            <h4 className="text-sm font-semibold text-yellow-500/80 uppercase tracking-wider text-xs">
                                {cat.category}
                            </h4>
                            <ul className="space-y-2">
                                {cat.items.map((item, j) => (
                                    <li key={j} className="flex items-start gap-2 text-sm text-gray-300 group">
                                        <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5 group-hover:text-yellow-400 transition-colors" />
                                        <span className="group-hover:text-white transition-colors">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white/5 px-6 py-3 flex justify-between items-center text-xs text-gray-500">
                <span>Generado por Análisis de Sistema</span>
                <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    Arquitectura actual compatible
                </span>
            </div>
        </div>
    )
}

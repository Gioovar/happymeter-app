'use client'

import { useState, useEffect } from 'react'
import { Search, Command, FileText, Settings, Plus, BarChart3, Users, Zap, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CommandCenter() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const router = useRouter()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

    if (!open) return null

    const commands = [
        {
            section: 'Acciones Rápidas', items: [
                { icon: Plus, label: 'Crear Nueva Encuesta', href: '/dashboard/create', color: 'text-violet-400' },
                { icon: Zap, label: 'Ver Actividad Reciente', href: '#activity', color: 'text-yellow-400' },
                { icon: FileText, label: 'Exportar Reporte Global', href: '/dashboard/reports', color: 'text-green-400' },
            ]
        },
        {
            section: 'Navegación', items: [
                { icon: BarChart3, label: 'Ir a Estadísticas', href: '/dashboard/analytics', color: 'text-blue-400' },
                { icon: Users, label: 'Gestionar Staff', href: '/staff', color: 'text-fuchsia-400' },
                { icon: Settings, label: 'Configuración', href: '/dashboard/settings', color: 'text-gray-400' },
            ]
        }
    ]

    const filteredCommands = commands.map(section => ({
        ...section,
        items: section.items.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    })).filter(section => section.items.length > 0)

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setOpen(false)}
            />

            <div className="relative w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center px-4 py-3 border-b border-white/10">
                    <Search className="w-5 h-5 text-gray-500 mr-3" />
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-gray-500 text-lg h-8"
                        placeholder="Escribe un comando o busca..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-500 border border-white/5">ESC</span>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredCommands.length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            No se encontraron resultados para "{query}"
                        </div>
                    ) : (
                        filteredCommands.map((section, idx) => (
                            <div key={idx} className="mb-4 last:mb-0">
                                <h3 className="text-xs font-bold text-gray-500 uppercase px-3 py-2">{section.section}</h3>
                                <div className="space-y-1">
                                    {section.items.map((item, itemIdx) => (
                                        <button
                                            key={itemIdx}
                                            onClick={() => {
                                                router.push(item.href)
                                                setOpen(false)
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 hover:border-white/5 border border-transparent transition group text-left"
                                        >
                                            <div className={`p-2 rounded-md bg-white/5 ${item.color}`}>
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-gray-300 group-hover:text-white transition">{item.label}</span>
                                            {item.label.includes('Nueva') && (
                                                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/20">
                                                    NUEVO
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="px-4 py-2 bg-white/5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                    <div className="flex gap-3">
                        <span><strong>↑↓</strong> para navegar</span>
                        <span><strong>↵</strong> para seleccionar</span>
                    </div>
                    <div>
                        God Mode Activado
                    </div>
                </div>
            </div>
        </div>
    )
}

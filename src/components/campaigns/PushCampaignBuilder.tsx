'use client'

import { useState, useEffect } from 'react'
import { Bell, Users, CalendarClock, Send, BarChart3, Clock } from 'lucide-react'
import { launchPushCampaign } from '@/actions/campaigns'

export default function PushCampaignBuilder({ branchId }: { branchId?: string }) {
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [segment, setSegment] = useState('ALL')
    const [isSending, setIsSending] = useState(false)
    const [recentCampaigns, setRecentCampaigns] = useState<any[]>([])

    const sendCampaign = async () => {
        if (!title || !body) return alert("Título y Mensaje son requeridos")
        setIsSending(true)

        try {
            const result = await launchPushCampaign({
                title,
                body,
                segment,
                branchId
            })

            if (!result.success) {
                return alert(result.error || "Error al enviar la campaña")
            }

            setRecentCampaigns([{
                id: result.campaignId,
                name: title,
                status: 'DELIVERED',
                delivered: result.delivered,
                opened: 0, // Opens are tracked via analytics endpoint
                createdAt: new Date()
            }, ...recentCampaigns])

            setTitle('')
            setBody('')
            alert(`Campaña Push enviada exitosamente a ${result.delivered} usuarios.`)
        } catch (error) {
            alert("Error al enviar la campaña")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="bg-[#1a1d26] rounded-2xl border border-white/5 overflow-hidden flex flex-col xl:flex-row shadow-2xl">
            {/* BUILDER SECTION */}
            <div className="flex-1 p-6 lg:p-8 border-b xl:border-b-0 xl:border-r border-white/5 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                        <Bell className="w-5 h-5 text-violet-400" />
                        Nueva Campaña Push
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Envía notificaciones nativas directas al celular de tus clientes fidelizados.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Segmento de Audiencia</label>
                        <select
                            value={segment}
                            onChange={(e) => setSegment(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none"
                        >
                            <option value="ALL">Todos los clientes registrados</option>
                            <option value="VIP">Clientes VIP (Alto valor)</option>
                            <option value="INACTIVE">Inactivos (Más de 30 días sin visita)</option>
                            <option value="EXPIRING">Con puntos por vencer (Próximos 7 días)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Título de Notificación</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: ¡2x1 Exclusivo Hoy!"
                            maxLength={40}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors placeholder:text-gray-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Mensaje</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Ej: Muestra este mensaje en tu próxima visita y obtén tu beneficio."
                            maxLength={140}
                            rows={3}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors resize-none placeholder:text-gray-600"
                        />
                        <div className="text-right mt-1 text-xs text-gray-500">
                            {body.length}/140 caracteres
                        </div>
                    </div>
                </div>

                <button
                    onClick={sendCampaign}
                    disabled={isSending || !title || !body}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSending ? (
                        <>Procesando envíos...</>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Lanzar Campaña
                        </>
                    )}
                </button>
            </div>

            {/* ANALYTICS SECTION */}
            <div className="w-full xl:w-96 p-6 lg:p-8 bg-black/20">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-fuchsia-400" />
                        Historial y Rendimiento
                    </h3>
                </div>

                {recentCampaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500">
                        <CalendarClock className="w-8 h-8 mb-3 opacity-20" />
                        <p className="text-sm">Aún no hay campañas enviadas.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentCampaigns.map(camp => (
                            <div key={camp.id} className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3 relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-sm text-gray-200 truncate pr-4">{camp.name}</h4>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium shrink-0">
                                        ENVIADA
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-black/30 rounded-lg p-2.5">
                                        <div className="text-xs text-gray-500 mb-0.5">Entregados</div>
                                        <div className="font-semibold text-white">{camp.delivered}</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-2.5">
                                        <div className="text-xs text-gray-500 mb-0.5">Aperturas</div>
                                        <div className="font-semibold text-fuchsia-400">{camp.opened}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-600 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    Hace un momento
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

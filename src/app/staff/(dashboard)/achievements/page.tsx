'use client'

import React, { useState, useEffect } from 'react'
import { getPendingVerifications, verifyAchievement } from '@/actions/staff-achievements'
import { CheckCircle2, XCircle, ExternalLink, Loader2, AlertCircle, Trophy } from 'lucide-react'
import ManageAchievementsModal from '@/components/staff/ManageAchievementsModal'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function StaffAchievementsPage() {
    const [verifications, setVerifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const load = async () => {
        try {
            const data = await getPendingVerifications()
            setVerifications(data)
        } catch (error) {
            toast.error('Error cargando verificaciones')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        load()
    }, [])

    const handleVerify = async (id: string, approved: boolean) => {
        setProcessing(id)
        try {
            await verifyAchievement(id, approved)
            toast.success(approved ? 'Logro aprobado y fondos liberados' : 'Logro rechazado')
            load() // Refresh list
        } catch (error) {
            toast.error('Error procesando solicitud')
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20">
                        <Trophy className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Validación de Logros</h1>
                        <p className="text-gray-400 mt-1">Revisa las evidencias enviadas para liberar pagos.</p>
                    </div>
                </div>
                <ManageAchievementsModal />
            </div>

            {verifications.length === 0 ? (
                <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/10">
                    <CheckCircle2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white">¡Todo al día!</h3>
                    <p className="text-gray-500">No hay verificaciones pendientes en este momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {verifications.map((item) => (
                        <div key={item.id} className="bg-[#111] border border-white/10 text-white rounded-xl p-6 shadow-sm hover:border-violet-500/50 transition flex flex-col lg:flex-row gap-6">
                            {/* Evidence Preview (If image) - For now just icon/link */}
                            <div className="shrink-0 flex items-center justify-center w-full lg:w-48 h-48 bg-black rounded-lg border border-white/10 overflow-hidden relative group">
                                {item.evidenceUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                    <img src={item.evidenceUrl} alt="Evidencia" className="w-full h-full object-cover" />
                                ) : (
                                    <ExternalLink className="w-12 h-12 text-gray-600" />
                                )}
                                <a
                                    href={item.evidenceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300"
                                >
                                    <span className="text-white text-xs font-bold flex items-center gap-1">
                                        <ExternalLink className="w-4 h-4" /> Abrir Enlace
                                    </span>
                                </a>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{item.achievement.name}</h3>
                                            <p className="text-sm text-violet-400 font-medium">Nivel {item.achievement.level} • Recompensa: ${item.achievement.rewardAmount} MXN</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-white">@{item.creator.instagram || item.creator.code}</p>
                                            <p className="text-xs text-gray-500">{item.creator.paypalEmail || 'Sin email registrado'}</p>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-400 bg-white/5 p-3 rounded-lg border border-white/10 italic">
                                        "{item.achievement.description}"
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <AlertCircle className="w-3 h-3" />
                                    Enviado el {item.submittedAt ? format(new Date(item.submittedAt), "d 'de' MMMM 'a las' HH:mm", { locale: es }) : 'Fecha desconocida'}
                                </div>
                            </div>

                            <div className="flex lg:flex-col gap-3 shrink-0 justify-center">
                                <button
                                    onClick={() => handleVerify(item.id, true)}
                                    disabled={processing === item.id}
                                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {processing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Aprobar
                                </button>
                                <button
                                    onClick={() => handleVerify(item.id, false)}
                                    disabled={processing === item.id}
                                    className="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { getPendingVisits, getAllVisits, updateVisitStatus } from '@/actions/staff-visits'
import { Loader2, CheckCircle2, XCircle, Calendar, MapPin, User, Clock, MessageCircle, Phone, Store, Star, Mail, Link as LinkIcon, Share2 } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'



export default function StaffVisitsPage() {
    const [visits, setVisits] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const loadVisits = async () => {
        setLoading(true)
        try {
            const data = activeTab === 'pending' ? await getPendingVisits() : await getAllVisits()
            setVisits(data)
        } catch (error) {
            toast.error('Error cargando visitas')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadVisits()
    }, [activeTab])

    const handleAction = async (visitId: string, status: 'APPROVED' | 'REJECTED') => {
        setActionLoading(visitId)
        try {
            await updateVisitStatus(visitId, status)
            toast.success(`Visita ${status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}`)
            // Remove from list
            setVisits(prev => prev.filter(v => v.id !== visitId))
        } catch (error) {
            toast.error('Error al actualizar estado')
        } finally {
            setActionLoading(null)
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-fuchsia-500" />
                        Solicitudes de Visita
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Gestiona las solicitudes de creadores para visitar lugares.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-2 text-sm font-bold transition border-b-2 ${activeTab === 'pending' ? 'border-fuchsia-500 text-fuchsia-500' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Pendientes
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 text-sm font-bold transition border-b-2 ${activeTab === 'history' ? 'border-fuchsia-500 text-fuchsia-500' : 'border-transparent text-gray-400 hover:text-white'}`}
                >
                    Historial Completo
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                </div>
            ) : visits.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    <CheckCircle2 className="w-12 h-12 text-green-500/50 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">Todo al día</h3>
                    <p className="text-gray-500 mt-2">No hay solicitudes {activeTab === 'pending' ? 'pendientes' : 'registradas'}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visits.map(visit => (
                        <div key={visit.id} className="bg-[#111] border border-white/10 rounded-xl overflow-hidden hover:border-fuchsia-500/30 transition shadow-lg">
                            <div className="h-32 bg-white/5 relative">
                                {visit.place.coverImage && (
                                    <img src={visit.place.coverImage} className="w-full h-full object-cover opacity-50" />
                                )}
                                <div className="absolute inset-0 flex items-end p-4 bg-gradient-to-t from-black/90 to-transparent">
                                    <h3 className="font-bold text-white text-lg leading-tight">{visit.place.name}</h3>
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{visit.creator.fullName || "Creador Estándar"}</p>
                                        <p className="text-xs text-fuchsia-400 truncate max-w-[180px]">
                                            @{visit.creator.instagram || visit.creator.userId.slice(0, 8)}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-3 space-y-2 text-sm border border-white/5">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span className="capitalize">{format(new Date(visit.visitDate), "EEEE d 'de' MMMM", { locale: es })}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Clock className="w-4 h-4 text-gray-500" />
                                        <span>{format(new Date(visit.visitDate), "h:mm a")}</span>
                                    </div>
                                </div>

                                {(visit.creator.whatsapp || visit.creator.contactPhone) && (
                                    <div className="flex gap-2">
                                        {visit.creator.whatsapp && (
                                            <a
                                                href={`https://wa.me/${visit.creator.whatsapp.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-xs font-bold transition border border-green-500/20"
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                            </a>
                                        )}
                                        {(visit.creator.contactPhone || visit.creator.whatsapp) && (
                                            <a
                                                href={`tel:${visit.creator.contactPhone || visit.creator.whatsapp}`}
                                                className="flex px-3 items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold transition border border-white/10"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                            </a>
                                        )}

                                    </div>
                                )}

                                {/* Place Contact */}
                                {visit.place.contactPhone && (
                                    <div className="pt-2 border-t border-white/5">
                                        <p className="text-[10px] uppercase text-gray-500 font-bold mb-2">Contactar Lugar ({visit.place.contactName || 'Admin'})</p>
                                        <div className="flex gap-2">
                                            <a
                                                href={`https://wa.me/${visit.place.contactPhone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition border border-blue-500/20"
                                            >
                                                <Store className="w-3.5 h-3.5" /> WA Lugar
                                            </a>
                                            <a
                                                href={`tel:${visit.place.contactPhone}`}
                                                className="flex px-3 items-center justify-center gap-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold transition border border-white/10"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                )}



                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    {visit.status === 'PENDING' ? (
                                        <>
                                            <button
                                                onClick={() => handleAction(visit.id, 'REJECTED')}
                                                disabled={!!actionLoading}
                                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition font-medium text-sm border border-red-500/20"
                                            >
                                                <XCircle className="w-4 h-4" /> Rechazar
                                            </button>
                                            <button
                                                onClick={() => handleAction(visit.id, 'APPROVED')}
                                                disabled={!!actionLoading}
                                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition font-medium text-sm border border-green-500/20"
                                            >
                                                {actionLoading === visit.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" /> Aprobar
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="col-span-2">
                                            {visit.status === 'APPROVED' && (
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-[10px] uppercase text-fuchsia-400 font-bold tracking-wider text-center pt-2 border-t border-white/5">
                                                        Enviar Encuesta de Satisfacción
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const url = `${window.location.origin}/rate-creator/${visit.id}`
                                                                navigator.clipboard.writeText(url)
                                                                toast.success('Link copiado al portapapeles')
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 transition font-medium text-xs border border-white/10"
                                                        >
                                                            <LinkIcon className="w-3.5 h-3.5" /> Copiar Link
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const url = `${window.location.origin}/rate-creator/${visit.id}`
                                                                const subject = encodeURIComponent(`Encuesta de Satisfacción: ${visit.creator.fullName || 'Creador'}`)
                                                                const body = encodeURIComponent(`Hola,\n\nPor favor califica tu experiencia con la visita de ${visit.creator.fullName || 'el creador'} aquí:\n\n${url}\n\nGracias.`)
                                                                window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
                                                            }}
                                                            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 transition font-medium text-xs border border-white/10"
                                                        >
                                                            <Mail className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const url = `${window.location.origin}/rate-creator/${visit.id}`
                                                            if (visit.place.contactPhone) {
                                                                const msg = `¡Hola! Aquí tienes el link para calificar la visita del creador: ${url}`
                                                                window.open(`https://wa.me/${visit.place.contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
                                                            } else {
                                                                toast.error('El lugar no tiene teléfono registrado')
                                                            }
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90 transition font-bold text-sm shadow-lg shadow-violet-600/20"
                                                    >
                                                        <MessageCircle className="w-4 h-4 fill-white/20" /> Enviar por WhatsApp
                                                    </button>
                                                </div>
                                            )}
                                            {visit.status === 'REJECTED' && (
                                                <div className="w-full py-2 bg-red-500/10 text-red-500 text-center rounded-lg text-sm border border-red-500/20">
                                                    Visit Rechazada
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div>
    )
}


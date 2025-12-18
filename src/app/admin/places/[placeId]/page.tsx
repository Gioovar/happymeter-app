'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, MapPin, Phone, User, FileText, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

export default function PlaceDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [place, setPlace] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        fetchPlace()
    }, [])

    const fetchPlace = async () => {
        try {
            const res = await fetch(`/api/admin/places/${params.placeId}`)
            if (res.ok) {
                const data = await res.json()
                setPlace(data)
            } else {
                toast.error('Lugar no encontrado')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar este lugar? Esta acción no se puede deshacer.')) return

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/admin/places/${params.placeId}`, {
                method: 'DELETE'
            })
            if (res.ok) {
                toast.success('Lugar eliminado')
                router.push('/admin/places')
            }
        } catch (error) {
            toast.error('Error al eliminar')
        } finally {
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return <div className="p-12 text-center text-gray-500">Cargando detalles...</div>
    }

    if (!place) return null

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/places" className="p-2 hover:bg-white/5 rounded-lg transition">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {place.name}
                            {place.isActive ? (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Activo</span>
                            ) : (
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">Inactivo</span>
                            )}
                        </h1>
                        <p className="text-gray-400 flex items-center gap-1 mt-1 text-sm">
                            <MapPin className="w-3 h-3" /> {place.address}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Cover Image */}
                    <div className="w-full h-64 bg-[#111] rounded-2xl overflow-hidden relative border border-white/5">
                        {place.coverImage ? (
                            <img src={place.coverImage} alt={place.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                <MapPin className="w-12 h-12 text-gray-600" />
                            </div>
                        )}
                    </div>

                    {/* Details Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm uppercase font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <User className="w-4 h-4" /> Contacto
                            </h3>
                            <div className="space-y-2">
                                <p className="font-medium text-white">{place.contactName || 'Sin nombre'}</p>
                                <p className="text-sm text-gray-400 flex items-center gap-2">
                                    <Phone className="w-3 h-3" /> {place.contactPhone || 'Sin teléfono'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm uppercase font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Acuerdo
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                {place.agreementDetails || 'No hay detalles registrados.'}
                            </p>
                        </div>
                    </div>

                    {/* Visit History */}
                    <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5">
                            <h3 className="text-lg font-bold">Historial de Visitas</h3>
                        </div>
                        {place.visits?.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                Ningún creador ha visitado este lugar aún.
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-gray-400 font-medium">
                                    <tr>
                                        <th className="p-4">Creador</th>
                                        <th className="p-4">Fecha</th>
                                        <th className="p-4">Estado</th>
                                        <th className="p-4 text-right">Evidencia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {place.visits?.map((visit: any) => (
                                        <tr key={visit.id} className="hover:bg-white/[0.02]">
                                            <td className="p-4 font-bold text-white">
                                                {/* In a real app we'd resolve the name from CreatorId */}
                                                Creador #{visit.creator.code}
                                            </td>
                                            <td className="p-4 text-gray-400">
                                                {new Date(visit.visitDate).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${visit.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                                        visit.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {visit.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {visit.evidenceUrl && (
                                                    <a href={visit.evidenceUrl} target="_blank" className="text-violet-400 hover:text-violet-300">
                                                        Ver Foto
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                        <h3 className="text-sm uppercase font-bold text-gray-500 mb-4">Estadísticas</h3>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-400">Visitas Totales</span>
                            <span className="text-2xl font-bold text-white">{place.visits?.length || 0}</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                            {/* Mock progress bar */}
                            <div className="bg-violet-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                        <p className="text-xs text-gray-500">
                            Última visita: {place.visits?.[0] ? new Date(place.visits[0].visitDate).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

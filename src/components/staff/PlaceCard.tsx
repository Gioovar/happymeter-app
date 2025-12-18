'use client'

import { MapPin, Phone, User, FileText, Edit, Power, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlaceCardProps {
    place: any
    onEdit: (place: any) => void
    onToggleStatus: (id: string, current: boolean) => void
    onDelete: (id: string) => void
}

export default function PlaceCard({ place, onEdit, onToggleStatus, onDelete }: PlaceCardProps) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col hover:border-violet-500/50 transition duration-300 group">
            {/* Image Area */}
            <div className="h-40 bg-black/40 relative overflow-hidden">
                {place.coverImage ? (
                    <img src={place.coverImage} alt={place.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 bg-white/5">
                        <MapPin className="w-10 h-10 opacity-20" />
                    </div>
                )}

                <div className="absolute top-2 right-2 flex gap-2">
                    <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md",
                        place.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                    )}>
                        {place.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col gap-4">
                <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-violet-400 transition">{place.name}</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {place.address || 'Sin dirección'}
                    </p>
                </div>

                <div className="space-y-2 flex-1">
                    <p className="text-sm text-gray-300 line-clamp-2" title={place.description}>
                        {place.description || 'Sin descripción'}
                    </p>

                    {place.agreementDetails && (
                        <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                            <h4 className="text-[10px] uppercase font-bold text-violet-400 mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Detalles del Acuerdo
                            </h4>
                            <p className="text-xs text-violet-200 line-clamp-3">
                                {place.agreementDetails}
                            </p>
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
                            <User className="w-3 h-3" /> Contacto
                        </p>
                        <p className="text-xs text-white truncate">{place.contactName || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Teléfono
                        </p>
                        <p className="text-xs text-white font-mono">{place.contactPhone || 'N/A'}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={() => onEdit(place)}
                        className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center gap-2 text-xs font-bold transition text-gray-300 hover:text-white"
                    >
                        <Edit className="w-3 h-3" /> Editar
                    </button>
                    <button
                        onClick={() => onToggleStatus(place.id, place.isActive)}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded hover:text-yellow-400 text-gray-500 transition"
                        title={place.isActive ? "Desactivar" : "Activar"}
                    >
                        <Power className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(place.id)}
                        className="p-1.5 bg-white/5 hover:bg-red-500/20 rounded hover:text-red-500 text-gray-500 transition"
                        title="Eliminar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Plus, MapPin, Search, ExternalLink, MoreHorizontal, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function PlacesPage() {
    const [places, setPlaces] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchPlaces()
    }, [])

    const fetchPlaces = async () => {
        try {
            const res = await fetch('/api/admin/places')
            if (res.ok) {
                const data = await res.json()
                setPlaces(data)
            }
        } catch (error) {
            console.error('Failed to fetch places', error)
            toast.error('Error al cargar lugares')
        } finally {
            setIsLoading(false)
        }
    }

    const filteredPlaces = places.filter(place =>
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.address?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Lugares y Convenios</h1>
                    <p className="text-gray-400 text-sm">Gestiona los establecimientos para creadores de contenido</p>
                </div>
                <Link href="/admin/places/create">
                    <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Lugar
                    </button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-[#111] p-2 rounded-xl border border-white/5">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-black/20 rounded-lg border border-white/5">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o dirección..."
                        className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="text-center py-12 text-gray-500">Cargando lugares...</div>
            ) : filteredPlaces.length === 0 ? (
                <div className="text-center py-12 bg-[#111] rounded-2xl border border-white/5">
                    <MapPin className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay lugares registrados</h3>
                    <p className="text-gray-500 text-sm mb-6">Comienza registrando un nuevo establecimiento.</p>
                    <Link href="/admin/places/create">
                        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition">
                            Crear Primero
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlaces.map((place) => (
                        <Link key={place.id} href={`/admin/places/${place.id}`}>
                            <div className="group bg-[#111] border border-white/5 rounded-2xl overflow-hidden hover:border-violet-500/30 transition duration-300">
                                <div className="h-40 bg-white/5 relative">
                                    {place.coverImage ? (
                                        <img src={place.coverImage} alt={place.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
                                            <MapPin className="w-10 h-10 text-violet-500/50" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur rounded text-xs font-medium border border-white/10">
                                        {place.isActive ? 'Activo' : 'Inactivo'}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold mb-1 group-hover:text-violet-400 transition">{place.name}</h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{place.description || 'Sin descripción'}</p>

                                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate max-w-[150px]">{place.address || 'Sin dirección'}</span>
                                        </div>
                                        <div>
                                            {place._count?.visits || 0} Visitas
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

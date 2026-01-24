'use client'

import { useState, useEffect } from 'react'
import { getPlaces, togglePlaceStatus, deletePlace } from '@/actions/staff-places'
import { Plus, Loader2, Store, Search } from 'lucide-react'
import PlaceCard from '@/components/staff/PlaceCard'
import ManagePlaceModal from '@/components/staff/ManagePlaceModal'
import { toast } from 'sonner'

export default function StaffPlacesPage() {
    const [places, setPlaces] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [placeToEdit, setPlaceToEdit] = useState<any>(null)

    useEffect(() => {
        loadPlaces()
    }, [])

    const loadPlaces = async () => {
        try {
            const data = await getPlaces()
            setPlaces(data)
        } catch (error) {
            toast.error('Error cargando lugares')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = () => {
        setPlaceToEdit(null)
        setIsModalOpen(true)
    }

    const handleEdit = (place: any) => {
        setPlaceToEdit(place)
        setIsModalOpen(true)
    }

    const handleToggleStatus = async (id: string, current: boolean) => {
        try {
            await togglePlaceStatus(id, current)
            toast.success(current ? 'Lugar desactivado' : 'Lugar activado')
            loadPlaces()
        } catch (error) {
            toast.error('Error al cambiar estado')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este lugar? Esta acción no se puede deshacer.')) return
        try {
            await deletePlace(id)
            toast.success('Lugar eliminado')
            loadPlaces()
        } catch (error) {
            toast.error('Error al eliminar')
        }
    }

    const filteredPlaces = places.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase()) ||
        p.niche?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Store className="w-8 h-8 text-violet-500" /> Lugares y Acuerdos
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Gestiona los establecimientos donde los creadores pueden crear contenido.
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-violet-600/20 transition hover:scale-105"
                >
                    <Plus className="w-5 h-5" /> Nuevo Lugar
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o descripción..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-violet-500 transition"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                </div>
            ) : filteredPlaces.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    <Store className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No hay lugares registrados</h3>
                    <p className="text-gray-500 mt-2">Agrega el primer lugar para comenzar.</p>
                    <button
                        onClick={handleCreate}
                        className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-bold transition"
                    >
                        Agregar Ahora
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlaces.map(place => (
                        <PlaceCard
                            key={place.id}
                            place={place}
                            onEdit={handleEdit}
                            onToggleStatus={handleToggleStatus}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <ManagePlaceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                placeToEdit={placeToEdit}
                onSuccess={loadPlaces}
            />
        </div>
    )
}

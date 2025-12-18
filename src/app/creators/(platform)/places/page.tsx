'use client'

import { useState, useEffect } from 'react'
import { getAvailablePlaces } from '@/actions/creator-places'
import { MapPin, Calendar, Clock, Loader2, Store, Search, ListChecks, Lightbulb, Link as LinkIcon, Info, ExternalLink, Maximize2, ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ScheduleVisitModal from '@/components/creators/ScheduleVisitModal'
import { toast } from 'sonner'

export default function CreatorPlacesPage() {
    const [places, setPlaces] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPlace, setSelectedPlace] = useState<any>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [search, setSearch] = useState('')

    // Content Modal State
    const [viewingContent, setViewingContent] = useState<{ title: string, content?: string, gallery?: string[], links?: string[] } | null>(null)

    useEffect(() => {
        loadPlaces()
    }, [])

    const loadPlaces = async () => {
        try {
            const data = await getAvailablePlaces()
            setPlaces(data)
        } catch (error) {
            toast.error('Error cargando locaciones')
        } finally {
            setLoading(false)
        }
    }

    const handleSchedule = (place: any) => {
        setSelectedPlace(place)
        setIsModalOpen(true)
    }

    const filteredPlaces = places.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Store className="w-8 h-8 text-fuchsia-500" /> Locaciones Disponibles
                </h1>
                <p className="text-gray-400 mt-1">
                    Explora los lugares autorizados para crear contenido y agenda tu visita.
                </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar restaurante, spot, etc..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-1 focus:ring-fuchsia-500 transition"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                </div>
            ) : filteredPlaces.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                    <Store className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-400">No hay lugares disponibles</h3>
                    <p className="text-gray-500 mt-2">Pronto agregaremos nuevas locaciones.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPlaces.map(place => (
                        <div key={place.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-fuchsia-500/50 transition duration-300 group flex flex-col">
                            {/* Image */}
                            <div className="h-48 bg-black/40 relative overflow-hidden">
                                {place.coverImage ? (
                                    <img src={place.coverImage} alt={place.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600 bg-white/5">
                                        <MapPin className="w-10 h-10 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <h3 className="absolute bottom-4 left-4 font-bold text-xl text-white">{place.name}</h3>
                            </div>

                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div>
                                    <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                                        {place.description || 'Sin descripción'}
                                    </p>
                                    <div className="flex items-start gap-2 text-xs text-gray-400">
                                        <MapPin className="w-3.5 h-3.5 mt-0.5 text-fuchsia-400" />
                                        <span>{place.address || 'Ubicación pendiente'}</span>
                                    </div>
                                </div>

                                {/* Agreement / Days Info */}
                                {place.agreementDetails && (
                                    <div className="p-3 bg-fuchsia-900/10 border border-fuchsia-500/10 rounded-lg flex items-start gap-2">
                                        <Calendar className="w-4 h-4 text-fuchsia-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-fuchsia-400 mb-1">Días y Condiciones</p>
                                            <p className="text-xs text-fuchsia-100 line-clamp-3 leading-relaxed">
                                                {place.agreementDetails}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Content Actions */}
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {place.requiredDeliverables && (
                                        <button
                                            onClick={() => setViewingContent({ title: 'Entregables Requeridos', content: place.requiredDeliverables, type: 'text' })}
                                            className="px-2 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition"
                                        >
                                            <ListChecks className="w-4 h-4" />
                                            Tareas
                                        </button>
                                    )}
                                    {place.contentIdeas && (
                                        <button
                                            onClick={() => setViewingContent({
                                                title: 'Ideas de Contenido',
                                                content: place.contentIdeas,
                                                gallery: Array.isArray(place.contentGallery) ? place.contentGallery : []
                                            })}
                                            className="px-2 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition"
                                        >
                                            <Lightbulb className="w-4 h-4" />
                                            Ideas
                                        </button>
                                    )}
                                    {(place.exampleLinks && place.exampleLinks.length > 0) || place.exampleContentUrl ? (
                                        <button
                                            onClick={() => {
                                                const links = Array.isArray(place.exampleLinks) ? place.exampleLinks : []
                                                if (place.exampleContentUrl && !links.includes(place.exampleContentUrl)) {
                                                    links.unshift(place.exampleContentUrl)
                                                }

                                                if (links.length === 1) {
                                                    window.open(links[0], '_blank')
                                                } else {
                                                    setViewingContent({
                                                        title: 'Ejemplos de Contenido',
                                                        links: links
                                                    })
                                                }
                                            }}
                                            className="px-2 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition text-center no-underline"
                                        >
                                            <LinkIcon className="w-4 h-4" />
                                            Ejemplos
                                        </button>
                                    ) : null}
                                </div>

                                <div className="mt-auto pt-4">
                                    <button
                                        onClick={() => handleSchedule(place)}
                                        className="w-full py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Agendar Visita
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }

            <ScheduleVisitModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                place={selectedPlace}
            />

            <Dialog open={!!viewingContent} onOpenChange={(open) => !open && setViewingContent(null)}>
                <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-2xl p-0 overflow-hidden shadow-2xl shadow-violet-900/10">
                    <div className={`p-6 bg-gradient-to-r border-b border-white/5 ${viewingContent?.title === 'Entregables Requeridos' ? 'from-pink-900/20 to-transparent' :
                        viewingContent?.title === 'Ideas de Contenido' ? 'from-yellow-900/20 to-transparent' :
                            'from-blue-900/20 to-transparent'
                        }`}>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-xl">
                                {viewingContent?.title === 'Entregables Requeridos' && <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400"><ListChecks className="w-6 h-6" /></div>}
                                {viewingContent?.title === 'Ideas de Contenido' && <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><Lightbulb className="w-6 h-6" /></div>}
                                {viewingContent?.title === 'Ejemplos de Contenido' && <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><LinkIcon className="w-6 h-6" /></div>}
                                <span className="font-bold tracking-tight">{viewingContent?.title}</span>
                            </DialogTitle>
                        </DialogHeader>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* Text Content */}
                        {viewingContent?.content && (
                            <div className="prose prose-invert max-w-none">
                                <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl">
                                    <p className="whitespace-pre-wrap text-gray-300 leading-7 text-[15px] font-medium font-sans">
                                        {viewingContent.content}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Gallery Grid */}
                        {viewingContent?.gallery && viewingContent.gallery.length > 0 && (
                            <div className="mt-8">
                                <h4 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                    <ImageIcon className="w-4 h-4" /> Inspiración Visual
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {viewingContent.gallery.map((url, idx) => (
                                        <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-lg cursor-zoom-in" onClick={() => window.open(url, '_blank')}>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all z-10" />
                                            <img src={url} alt="Inspiration" className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 ease-out" />
                                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-20">
                                                <div className="bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10">
                                                    <Maximize2 className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Links List */}
                        {viewingContent?.links && viewingContent.links.length > 0 && (
                            <div className="mt-2 space-y-3">
                                {viewingContent.links.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.08] hover:scale-[1.01] hover:border-blue-500/30 border border-white/5 rounded-2xl transition-all duration-300 group"
                                    >
                                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl group-hover:bg-blue-500/20 transition shadow-inner shadow-blue-500/5">
                                            <LinkIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-200 group-hover:text-blue-200 transition mb-0.5">Enlace Externo</p>
                                            <p className="text-xs text-gray-500 truncate group-hover:text-blue-400/70 transition font-mono">{link}</p>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end">
                        <button
                            onClick={() => setViewingContent(null)}
                            className="px-8 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 hover:scale-105 transition active:scale-95 text-sm"
                        >
                            Entendido
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}

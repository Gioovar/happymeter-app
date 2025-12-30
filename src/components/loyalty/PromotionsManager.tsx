"use client"

import { useState, useEffect } from "react"
import { createPromotion, deletePromotion, getPromotions } from "@/actions/loyalty"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, ImagePlus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface PromotionsManagerProps {
    programId: string
}

export function PromotionsManager({ programId }: PromotionsManagerProps) {
    const [promotions, setPromotions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newPromo, setNewPromo] = useState({
        title: "",
        description: "",
        imageUrl: ""
    })

    useEffect(() => {
        loadPromotions()
    }, [programId])

    const loadPromotions = async () => {
        setIsLoading(true)
        const res = await getPromotions(programId)
        if (res.success) {
            setPromotions(res.promotions || [])
        }
        setIsLoading(false)
    }

    const handleCreate = async () => {
        if (!newPromo.imageUrl) return

        const res = await createPromotion(programId, newPromo)
        if (res.success) {
            toast.success("Promoción creada")
            setIsCreating(false)
            setNewPromo({ title: "", description: "", imageUrl: "" })
            loadPromotions()
        } else {
            toast.error("Error al crear promoción")
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm("¿Eliminar esta promoción?")) {
            const res = await deletePromotion(programId, id)
            if (res.success) {
                toast.success("Promoción eliminada")
                loadPromotions()
            } else {
                toast.error("Error al eliminar")
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-white">Promociones Activas</h3>
                    <p className="text-gray-400 text-sm">Gestiona los banners que ven tus clientes.</p>
                </div>
                <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                        <button className="px-4 py-2 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nueva Promoción
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111] border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>Nueva Promoción</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">URL de Imagen</label>
                                <div className="flex gap-2">
                                    <input
                                        value={newPromo.imageUrl}
                                        onChange={(e) => setNewPromo({ ...newPromo, imageUrl: e.target.value })}
                                        placeholder="https://..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-600 mt-2">Recomendado: 800x400px</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Título (Opcional)</label>
                                <input
                                    value={newPromo.title}
                                    onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                                    placeholder="Ej. 2x1 en Cervezas"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descripción (Opcional)</label>
                                <textarea
                                    value={newPromo.description}
                                    onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                                    placeholder="Detalles de la promo..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
                                />
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={!newPromo.imageUrl}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                Crear Promoción
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {promotions.map((promo) => (
                        <div key={promo.id} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-video bg-black/50">
                            <img src={promo.imageUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4">
                                <h4 className="text-white font-bold truncate">{promo.title || "Sin título"}</h4>
                                {promo.description && <p className="text-gray-400 text-xs line-clamp-1">{promo.description}</p>}
                            </div>

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(promo.id)}
                                    className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {promotions.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
                            <ImagePlus className="w-10 h-10 mx-auto mb-4 opacity-50" />
                            <p>No hay promociones activas.</p>
                            <p className="text-sm">¡Crea la primera para atraer clientes!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

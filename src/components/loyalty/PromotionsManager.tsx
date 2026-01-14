"use client"

import { useState, useEffect } from "react"
import { createPromotion, deletePromotion, getPromotions } from "@/actions/loyalty"
import { toast } from "sonner"
import { Plus, Trash2, Loader2, ImagePlus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface PromotionsManagerProps {
    programId: string
}

export function PromotionsManager({ programId }: PromotionsManagerProps) {
    const [promotions, setPromotions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
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

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1280; // Reasonable max width for web

                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to WebP at 0.8 quality
                    resolve(canvas.toDataURL('image/webp', 0.8));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleCreate = async () => {
        if (!newPromo.imageUrl) return

        setIsSubmitting(true)
        try {
            const res = await createPromotion(programId, newPromo)
            if (res.success) {
                toast.success("Promoción creada")
                setIsCreating(false)
                setNewPromo({ title: "", description: "", imageUrl: "" })
                loadPromotions()
            } else {
                toast.error("Error al crear promoción")
            }
        } catch (error) {
            toast.error("Error inesperado")
        } finally {
            setIsSubmitting(false)
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
                    <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Nueva Promoción</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            {/* IMAGE UPLOAD AREA */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Imagen de la Promoción</label>
                                <div className="relative group w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 transition-colors bg-white/5 overflow-hidden flex flex-col items-center justify-center cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                try {
                                                    const compressed = await compressImage(file)
                                                    setNewPromo({ ...newPromo, imageUrl: compressed })
                                                    toast.success("Imagen optimizada correctamente")
                                                } catch (err) {
                                                    toast.error("Error al procesar imagen")
                                                }
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />

                                    {newPromo.imageUrl ? (
                                        <>
                                            <img src={newPromo.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 pointer-events-none">
                                                <p className="text-white font-medium flex items-center gap-2">
                                                    <ImagePlus className="w-5 h-5" /> Cambiar Imagen
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewPromo({ ...newPromo, imageUrl: "" })
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors z-30"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center p-6">
                                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all">
                                                <ImagePlus className="w-6 h-6" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-300">Sube una foto</p>
                                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (Max 2MB)</p>
                                        </div>
                                    )}
                                </div>
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
                                    placeholder="Detalles, restricciones o código..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500 h-24 resize-none"
                                />
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={!newPromo.imageUrl || isSubmitting}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    "Crear Promoción"
                                )}
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

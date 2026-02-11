"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Pencil, Trash2, Image as ImageIcon, Save, X, Loader2, MoreVertical, Utensils, Search } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { upsertProduct, deleteProduct, getCategories, createCategory, deleteCategory, createSubCategory, deleteSubCategory } from "@/actions/products"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface MenuManagerProps {
    userId: string
    onBack: () => void
}

export function MenuManager({ userId, onBack }: MenuManagerProps) {
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")

    // Subcategory State
    const [isCreatingSubCategory, setIsCreatingSubCategory] = useState(false)
    const [newSubCategoryName, setNewSubCategoryName] = useState("")

    // Product State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        subCategoryId: "none" // "none" or uuid
    })

    useEffect(() => {
        loadData()
    }, [userId])

    async function loadData() {
        setIsLoading(true)
        const res = await getCategories(userId)
        if (res.success) {
            setCategories(res.categories || [])
            // Select first category by default if none selected
            if (!selectedCategory && res.categories && res.categories.length > 0) {
                setSelectedCategory(res.categories[0].id)
            }
        } else {
            toast.error(res.error)
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
                    const MAX_WIDTH = 800; // Optimize for menu items
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
                    resolve(canvas.toDataURL('image/webp', 0.8));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return
        const res = await createCategory(userId, newCategoryName)
        if (res.success) {
            toast.success("Categoría creada")
            setNewCategoryName("")
            setIsCreatingCategory(false)
            loadData()
        } else {
            toast.error(res.error)
        }
    }

    const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm("¿Eliminar categoría y todos sus productos?")) {
            const res = await deleteCategory(id, userId)
            if (res.success) {
                toast.success("Categoría eliminada")
                if (selectedCategory === id) setSelectedCategory(null)
                loadData()
            } else {
                toast.error(res.error)
            }
        }
    }

    const handleCreateSubCategory = async () => {
        if (!newSubCategoryName.trim() || !selectedCategory) return
        const res = await createSubCategory(selectedCategory, newSubCategoryName)
        if (res.success) {
            toast.success("Subcategoría creada")
            setNewSubCategoryName("")
            setIsCreatingSubCategory(false)
            loadData()
        } else {
            toast.error(res.error)
        }
    }

    const handleDeleteSubCategory = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm("¿Eliminar subcategoría? Los productos quedarán sin subcategoría.")) {
            const res = await deleteSubCategory(id)
            if (res.success) {
                toast.success("Subcategoría eliminada")
                loadData()
            } else {
                toast.error(res.error)
            }
        }
    }

    const handleOpenProductModal = (product?: any) => {
        if (product) {
            setEditingProduct(product)
            setFormData({
                name: product.name,
                description: product.description || "",
                price: product.price.toString(),
                imageUrl: product.imageUrl || "",
                subCategoryId: product.subCategoryId || "none"
            })
        } else {
            setEditingProduct(null)
            setFormData({
                name: "",
                description: "",
                price: "",
                imageUrl: "",
                subCategoryId: "none"
            })
        }
        setIsProductModalOpen(true)
    }

    const handleSaveProduct = async () => {
        if (!selectedCategory) return toast.error("Selecciona una categoría")
        if (!formData.name || !formData.price) return toast.error("Nombre y precio requeridos")

        setIsSubmitting(true)
        try {
            const res = await upsertProduct({
                userId,
                categoryId: selectedCategory,
                subCategoryId: formData.subCategoryId === "none" ? undefined : formData.subCategoryId,
                id: editingProduct?.id,
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                imageUrl: formData.imageUrl
            })

            if (res.success) {
                toast.success(editingProduct ? "Producto actualizado" : "Producto creado")
                setIsProductModalOpen(false)
                loadData()
            } else {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error("Error al guardar")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteProduct = async (id: string) => {
        if (confirm("¿Eliminar producto?")) {
            const res = await deleteProduct(id, userId)
            if (res.success) {
                toast.success("Producto eliminado")
                loadData()
            } else {
                toast.error(res.error)
            }
        }
    }

    const activeCategory = categories.find(c => c.id === selectedCategory)
    const activeProducts = activeCategory ? activeCategory.products : []

    return (
        <div className="min-h-screen bg-black text-white p-4 lg:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Gestión de Menú
                        </h1>
                        <p className="text-gray-400 text-sm">Organiza tu carta digital</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                        {/* Categories Sidebar */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="font-bold text-lg text-white">Categorías</h2>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white/5 border-white/10 hover:bg-white/10 text-xs h-8"
                                    onClick={() => setIsCreatingCategory(true)}
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Nueva
                                </Button>
                            </div>

                            {isCreatingCategory && (
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2">
                                    <Input
                                        autoFocus
                                        placeholder="Nombre..."
                                        className="bg-black/50 border-white/10 h-8 text-sm mb-2"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsCreatingCategory(false)} className="text-xs text-gray-500 hover:text-white">Cancelar</button>
                                        <button onClick={handleCreateCategory} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">Guardar</button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <div
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={cn(
                                            "p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group",
                                            selectedCategory === cat.id
                                                ? "bg-white text-black font-bold shadow-lg shadow-white/5"
                                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        <span>{cat.name}</span>
                                        <button
                                            onClick={(e) => handleDeleteCategory(cat.id, e)}
                                            className={cn(
                                                "p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100",
                                                selectedCategory === cat.id ? "hover:bg-gray-200 text-gray-500" : "hover:bg-white/20 text-gray-400"
                                            )}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {categories.length === 0 && !isCreatingCategory && (
                                    <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">
                                        Sin categorías
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div>
                            {!selectedCategory ? (
                                <div className="bg-[#111] rounded-2xl p-6 border border-white/10 text-center py-20 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Utensils className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">Selecciona una categoría</h3>
                                    <p className="text-gray-500">O crea una nueva para comenzar.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold">{activeCategory?.name}</h2>
                                                <p className="text-gray-400 text-sm">{activeProducts.length} productos</p>
                                            </div>
                                            <Button
                                                onClick={() => handleOpenProductModal()}
                                                className="bg-white text-black hover:bg-gray-200 font-bold rounded-xl"
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Agregar Producto
                                            </Button>
                                        </div>

                                        {/* Subcategories Management */}
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Subcategorías</h3>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-xs hover:bg-white/10"
                                                    onClick={() => setIsCreatingSubCategory(true)}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" /> Nueva
                                                </Button>
                                            </div>

                                            {isCreatingSubCategory && (
                                                <div className="mb-4 flex gap-2">
                                                    <Input
                                                        autoFocus
                                                        placeholder="Nombre subcategoría..."
                                                        className="bg-black/50 border-white/10 h-8 text-sm"
                                                        value={newSubCategoryName}
                                                        onChange={e => setNewSubCategoryName(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleCreateSubCategory()}
                                                    />
                                                    <Button size="sm" onClick={handleCreateSubCategory} className="h-8 bg-indigo-600 hover:bg-indigo-700">Guardar</Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setIsCreatingSubCategory(false)} className="h-8">Cancelar</Button>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                {activeCategory?.subCategories?.length === 0 && !isCreatingSubCategory && (
                                                    <span className="text-xs text-gray-500 italic">No hay subcategorías definidas</span>
                                                )}
                                                {activeCategory?.subCategories?.map((sub: any) => (
                                                    <div key={sub.id} className="group relative pl-3 pr-8 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm flex items-center">
                                                        <span>{sub.name}</span>
                                                        <button
                                                            onClick={(e) => handleDeleteSubCategory(sub.id, e)}
                                                            className="absolute right-1 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {activeProducts.map((product: any) => (
                                            <div key={product.id} className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden group hover:border-white/20 transition-all">
                                                <div className="aspect-[4/3] bg-white/5 relative overflow-hidden">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                            <ImageIcon className="w-8 h-8" />
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleOpenProductModal(product)}
                                                            className="p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 backdrop-blur-sm"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 backdrop-blur-sm"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className="font-bold text-white truncate pr-2">{product.name}</h3>
                                                        <span className="font-bold text-indigo-400">${product.price}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 line-clamp-2 h-10">{product.description || "Sin descripción"}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {activeProducts.length === 0 && (
                                            <div
                                                onClick={() => handleOpenProductModal()}
                                                className="col-span-full py-12 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-white/20 hover:bg-white/5 transition-all"
                                            >
                                                <Plus className="w-8 h-8 mb-2 opacity-50" />
                                                <p>Agregar primer producto</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Product Modal */}
                <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                    <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Foto</label>
                                <div className="relative w-full aspect-[4/3] rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-white/5 overflow-hidden flex flex-col items-center justify-center cursor-pointer group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                try {
                                                    const compressed = await compressImage(file)
                                                    setFormData({ ...formData, imageUrl: compressed })
                                                    toast.success("Imagen procesada")
                                                } catch (err) {
                                                    toast.error("Error al procesar imagen")
                                                }
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    {formData.imageUrl ? (
                                        <>
                                            <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setFormData({ ...formData, imageUrl: "" })
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg z-20 hover:bg-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-500 group-hover:text-indigo-400">
                                            <ImageIcon className="w-8 h-8 mb-2" />
                                            <span className="text-xs">Subir foto</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label className="text-gray-400">Subcategoría (Opcional)</Label>
                                    <select
                                        value={formData.subCategoryId}
                                        onChange={e => setFormData({ ...formData, subCategoryId: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-md h-10 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="none" className="bg-black">Ninguna</option>
                                        {activeCategory?.subCategories?.map((sub: any) => (
                                            <option key={sub.id} value={sub.id} className="bg-black">
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-gray-400">Nombre</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-white/5 border-white/10 focus:border-indigo-500"
                                        placeholder="Ej. Hamburguesa Clásica"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label className="text-gray-400">Precio ($)</Label>
                                    <Input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="bg-white/5 border-white/10 focus:border-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-gray-400">Descripción</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-white/5 border-white/10 focus:border-indigo-500 h-20 resize-none"
                                    placeholder="Ingredientes, detalles..."
                                />
                            </div>

                            <Button
                                onClick={handleSaveProduct}
                                disabled={isSubmitting}
                                className="w-full bg-white text-black hover:bg-gray-200 font-bold"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Guardar Producto
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

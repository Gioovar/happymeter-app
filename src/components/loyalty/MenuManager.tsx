"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Pencil, Trash2, Image as ImageIcon, Save, X, Loader2, MoreVertical, Utensils, Search, Star, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { upsertProduct, deleteProduct, getCategories, createCategory, deleteCategory, createSubCategory, deleteSubCategory, toggleProductFeatured } from "@/actions/products"
import { getPromotions, createPromotion, deletePromotion, togglePromotion } from "@/actions/menu-promotions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface MenuManagerProps {
    userId: string
    onBack: () => void
}

export default function MenuManager({ userId, onBack }: MenuManagerProps) {
    const [viewMode, setViewMode] = useState<'products' | 'promotions'>('products')
    const [categories, setCategories] = useState<any[]>([])
    const [promotions, setPromotions] = useState<any[]>([])
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
        subCategoryId: "none",
        isFeatured: false,
        unit: 'ml',
        size: '',
        highlightedNote: ''
    })

    useEffect(() => {
        loadData()
    }, [userId])

    async function loadData() {
        setIsLoading(true)
        const [catsRes, promos] = await Promise.all([
            getCategories(userId),
            getPromotions(userId)
        ])

        if (catsRes.success) {
            setCategories(catsRes.categories || [])
            if (!selectedCategory && catsRes.categories && catsRes.categories.length > 0) {
                // Only set default if we are in products view? Or just keep state
                if (!selectedCategory) setSelectedCategory(catsRes.categories[0].id)
            }
        }

        setPromotions(promos)
        setIsLoading(false)
    }

    const handleCreatePromotion = async (file: File) => {
        try {
            toast.loading("Subiendo promoción...")
            const compressed = await compressImage(file)
            const res = await createPromotion(userId, compressed)
            if (res.success) {
                toast.dismiss()
                toast.success("Promoción agregada")
                loadData()
            } else {
                toast.error("Error al crear promoción")
            }
        } catch (error) {
            toast.error("Error al procesar imagen")
        }
    }

    const handleTogglePromotion = async (id: string, current: boolean) => {
        // Optimistic
        setPromotions(prev => prev.map(p => p.id === id ? { ...p, isActive: !current } : p))
        await togglePromotion(id, !current)
    }

    const handleDeletePromotion = async (id: string) => {
        if (!confirm("¿Eliminar esta promoción?")) return
        setPromotions(prev => prev.filter(p => p.id !== id))
        await deletePromotion(id)
        toast.success("Promoción eliminada")
    }

    const handleToggleFeatured = async (product: any, e: React.MouseEvent) => {
        e.stopPropagation()
        // Optimistic
        const newStatus = !product.isFeatured

        // Deep update in local state is tricky with nested categories. 
        // We will just reloadData silently or try to find it.
        // For simplicity, just trigger server action and reload or update local state if easy.

        // Find category index
        const catIndex = categories.findIndex(c => c.id === product.categoryId)
        if (catIndex === -1) return

        const updatedCategories = [...categories]
        const prodIndex = updatedCategories[catIndex].products.findIndex((p: any) => p.id === product.id)
        if (prodIndex === -1) return

        updatedCategories[catIndex].products[prodIndex].isFeatured = newStatus
        setCategories(updatedCategories)

        await toggleProductFeatured(product.id, newStatus)
        toast.success(newStatus ? "Producto destacado" : "Producto no destacado")
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
                subCategoryId: product.subCategoryId || "none",
                isFeatured: product?.isFeatured || false,
                unit: product?.unit || 'ml',
                size: product?.size || '',
                highlightedNote: product?.highlightedNote || ''
            })
        } else {
            setEditingProduct(null)
            setFormData({
                name: "",
                description: "",
                price: "",
                imageUrl: "",
                subCategoryId: "none",
                isFeatured: false,
                unit: 'ml',
                size: '',
                highlightedNote: ''
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
                imageUrl: formData.imageUrl,
                isFeatured: formData.isFeatured,
                unit: formData.unit,
                size: formData.size ? parseFloat(formData.size.toString()) : undefined,
                highlightedNote: formData.highlightedNote
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
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 ps-2">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2.5 hover:bg-white/10 rounded-full transition-all text-gray-400 hover:text-white border border-transparent hover:border-white/10"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                                Gestión de Menú
                            </h1>
                            <p className="text-gray-400 text-sm font-medium tracking-wide">Organiza tu carta digital</p>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        {/* View Switcher */}
                        <div className="flex bg-black/40 backdrop-blur-xl p-1.5 rounded-2xl w-fit mb-8 border border-white/10 sticky top-4 z-50 shadow-2xl shadow-black/50">
                            <button
                                onClick={() => setViewMode('products')}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
                                    viewMode === 'products'
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                Productos
                            </button>
                            <button
                                onClick={() => setViewMode('promotions')}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2",
                                    viewMode === 'promotions'
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Megaphone className="w-4 h-4" /> Promociones
                            </button>
                        </div>

                        {viewMode === 'promotions' ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                                    {/* Existing Promotion Content... (Keeping it simple for now, can enhance later) */}
                                    <h2 className="text-xl font-bold mb-2">Banners Promocionales</h2>
                                    <p className="text-gray-400 text-sm mb-6">Sube imágenes para el carrusel principal. (Recomendado: 16:9 aspecto ancho)</p>

                                    {/* Upload Area */}
                                    <div className="relative w-full h-32 border-2 border-dashed border-white/10 rounded-xl hover:border-indigo-500/50 bg-white/5 flex flex-col items-center justify-center cursor-pointer group mb-8 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) handleCreatePromotion(e.target.files[0])
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <ImageIcon className="w-8 h-8 text-gray-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                                        <span className="text-sm text-gray-400 group-hover:text-indigo-300">Click para subir banner</span>
                                    </div>

                                    {/* Banners Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {promotions.map(promo => (
                                            <div key={promo.id} className="relative group rounded-xl overflow-hidden border border-white/10 bg-black aspect-video">
                                                <img src={promo.imageUrl} className={cn("w-full h-full object-cover transition-opacity", !promo.isActive && "opacity-50 grayscale")} />

                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleTogglePromotion(promo.id, promo.isActive)}
                                                        className={cn("px-3 py-1.5 rounded-lg text-xs font-bold", promo.isActive ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400")}
                                                    >
                                                        {promo.isActive ? "Desactivar" : "Activar"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePromotion(promo.id)}
                                                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {!promo.isActive && (
                                                    <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-gray-400 font-bold border border-white/10">Inactivo</div>
                                                )}
                                            </div>
                                        ))}
                                        {promotions.length === 0 && (
                                            <div className="col-span-full py-12 text-center text-gray-500 border border-white/5 rounded-xl bg-white/[0.02]">
                                                No hay promociones activas
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
                                {/* Categories Sidebar */}
                                <div className="space-y-4 sticking top-24">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <h2 className="font-bold text-lg text-gray-200">Categorías</h2>
                                        <button
                                            onClick={() => setIsCreatingCategory(true)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-lg hover:shadow-indigo-500/25"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {isCreatingCategory && (
                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
                                            <Input
                                                autoFocus
                                                placeholder="Nombre..."
                                                className="bg-black/50 border-white/10 h-9 text-sm mb-3 rounded-lg"
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setIsCreatingCategory(false)} className="px-3 py-1 rounded-md text-xs font-medium text-gray-500 hover:text-white hover:bg-white/5">Cancelar</button>
                                                <button onClick={handleCreateCategory} className="px-3 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700">Guardar</button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 pr-2 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                                        {categories.map(cat => (
                                            <div
                                                key={cat.id}
                                                onClick={() => setSelectedCategory(cat.id)}
                                                className={cn(
                                                    "p-3.5 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group border",
                                                    selectedCategory === cat.id
                                                        ? "bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-900/30 translate-x-1"
                                                        : "bg-white/[0.03] border-transparent text-gray-400 hover:bg-white/[0.08] hover:text-white hover:border-white/5"
                                                )}
                                            >
                                                <span className="font-medium tracking-wide">{cat.name}</span>
                                                <button
                                                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100",
                                                        selectedCategory === cat.id ? "hover:bg-indigo-500 text-indigo-200" : "hover:bg-white/10 text-gray-500 hover:text-red-400"
                                                    )}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {categories.length === 0 && !isCreatingCategory && (
                                            <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                                                Sin categorías
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Products Grid */}
                                <div className="min-w-0">
                                    {!selectedCategory ? (
                                        <div className="bg-[#111]/80 border border-white/10 rounded-3xl p-12 text-center flex flex-col items-center backdrop-blur-sm">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/10">
                                                <Utensils className="w-10 h-10 text-gray-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">Selecciona una categoría</h3>
                                            <p className="text-gray-500 max-w-xs mx-auto">Selecciona una categoría del menú lateral o crea una nueva para comenzar a agregar productos.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            {/* Category Header & Stats */}
                                            <div className="flex flex-col gap-6">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-br from-white/[0.08] to-transparent rounded-3xl border border-white/5 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                                                    <div className="relative z-10">
                                                        <h2 className="text-3xl font-bold text-white mb-1 tracking-tight">{activeCategory?.name}</h2>
                                                        <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                                                            <span className="bg-white/10 px-2 py-0.5 rounded text-white">{activeProducts.length}</span>
                                                            <span>productos en total</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleOpenProductModal()}
                                                        className="relative z-10 bg-white text-black hover:bg-indigo-50 hover:text-indigo-600 font-bold rounded-xl h-11 px-6 shadow-lg shadow-black/20 transition-all active:scale-95"
                                                    >
                                                        <Plus className="w-4 h-4 mr-2" /> Agregar Producto
                                                    </Button>
                                                </div>

                                                {/* Subcategories Management */}
                                                <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-4 w-1 bg-indigo-500 rounded-full" />
                                                            <h3 className="font-bold text-sm text-gray-300 uppercase tracking-wider">Subcategorías</h3>
                                                        </div>
                                                        {!isCreatingSubCategory && (
                                                            <button
                                                                onClick={() => setIsCreatingSubCategory(true)}
                                                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" /> Nueva
                                                            </button>
                                                        )}
                                                    </div>

                                                    {isCreatingSubCategory && (
                                                        <div className="mb-6 p-4 bg-black/40 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-3 animate-in fade-in zoom-in-95">
                                                            <Input
                                                                autoFocus
                                                                placeholder="Nombre de la subcategoría..."
                                                                className="bg-white/5 border-white/10 h-10 text-sm rounded-xl focus:ring-1 focus:ring-indigo-500"
                                                                value={newSubCategoryName}
                                                                onChange={e => setNewSubCategoryName(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && handleCreateSubCategory()}
                                                            />
                                                            <div className="flex gap-2 shrink-0">
                                                                <Button size="sm" onClick={handleCreateSubCategory} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold">Guardar</Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setIsCreatingSubCategory(false)} className="h-10 px-4 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white">Cancelar</Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-3">
                                                        {activeCategory?.subCategories?.length === 0 && !isCreatingSubCategory && (
                                                            <span className="text-sm text-gray-500 italic py-2">No hay subcategorías definidas. Crea una para organizar mejor tus productos.</span>
                                                        )}
                                                        {activeCategory?.subCategories?.map((sub: any) => (
                                                            <div key={sub.id} className="group relative pl-4 pr-9 py-2 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-500/40 rounded-full text-sm font-medium text-indigo-200 transition-all hover:shadow-[0_0_15px_-5px_rgba(99,102,241,0.3)] flex items-center">
                                                                <span>{sub.name}</span>
                                                                <button
                                                                    onClick={(e) => handleDeleteSubCategory(sub.id, e)}
                                                                    className="absolute right-1 w-7 h-7 flex items-center justify-center rounded-full text-indigo-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {activeProducts.map((product: any) => (
                                                    <div key={product.id} className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden group hover:border-indigo-500/30 hover:bg-white/[0.06] transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1">
                                                        <div className="aspect-[4/3] bg-black/20 relative overflow-hidden">
                                                            {product.imageUrl ? (
                                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-700 bg-white/5">
                                                                    <ImageIcon className="w-10 h-10 opacity-20" />
                                                                </div>
                                                            )}

                                                            {/* Featured Badge */}
                                                            {product.isFeatured && (
                                                                <div className="absolute top-3 left-3 bg-yellow-400 text-black p-1.5 rounded-full shadow-lg shadow-yellow-400/20 z-10 animate-in zoom-in">
                                                                    <Star className="w-3.5 h-3.5 fill-black" />
                                                                </div>
                                                            )}

                                                            {/* Highlighted Note Badge */}
                                                            {product.highlightedNote && (
                                                                <div className="absolute bottom-3 left-3 right-3">
                                                                    <span className="inline-block px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-yellow-400 uppercase tracking-wider shadow-lg truncate max-w-full">
                                                                        {product.highlightedNote}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Actions Overlay */}
                                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                                <button
                                                                    onClick={(e) => handleToggleFeatured(product, e)}
                                                                    className={cn(
                                                                        "p-2.5 rounded-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-lg",
                                                                        product.isFeatured ? "bg-yellow-400 text-black" : "bg-white/10 text-white hover:bg-white/20"
                                                                    )}
                                                                    title={product.isFeatured ? "Quitar destacado" : "Destacar producto"}
                                                                >
                                                                    <Star className={cn("w-4 h-4", product.isFeatured && "fill-black")} />
                                                                </button>

                                                                <button
                                                                    onClick={() => handleOpenProductModal(product)}
                                                                    className="p-2.5 bg-white text-black rounded-xl hover:bg-gray-200 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-lg"
                                                                    title="Editar"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteProduct(product.id)}
                                                                    className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-lg"
                                                                    title="Eliminar"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="p-4 flex flex-col h-full relative">
                                                            <div className="mb-3">
                                                                <h3 className="font-extrabold text-white text-lg leading-tight mb-2" title={product.name}>
                                                                    {product.name}
                                                                </h3>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-bold text-indigo-300 text-xl tracking-tight">
                                                                        ${product.price}
                                                                    </span>
                                                                    {(product.size || product.unit) && (
                                                                        <div className="text-xs font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                            {product.size && <span>{product.size}</span>}
                                                                            {product.unit && <span className="uppercase">{product.unit}</span>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mt-auto text-xs font-medium">
                                                                {product.description || <span className="italic opacity-30">Sin descripción</span>}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}

                                                {activeProducts.length === 0 && (
                                                    <div
                                                        onClick={() => handleOpenProductModal()}
                                                        className="col-span-full py-16 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group"
                                                    >
                                                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                            <Plus className="w-8 h-8 opacity-50 text-indigo-400" />
                                                        </div>
                                                        <h4 className="font-bold text-gray-400 group-hover:text-indigo-400 transition-colors">Agregar primer producto</h4>
                                                        <p className="text-sm text-gray-600">Click para comenzar a llenar esta categoría</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                            <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md max-h-[85vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
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

                                    {/* New Fields: Portion & Unit */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-gray-400">Tamaño / Porción</Label>
                                            <Input
                                                type="number"
                                                value={formData.size}
                                                onChange={e => setFormData({ ...formData, size: e.target.value })}
                                                className="bg-white/5 border-white/10 focus:border-indigo-500"
                                                placeholder="Ej. 500"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-400">Unidad</Label>
                                            <select
                                                value={formData.unit}
                                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-md h-10 px-3 text-sm focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="ml" className="bg-black">ml (Mililitros)</option>
                                                <option value="lt" className="bg-black">lt (Litros)</option>
                                                <option value="gr" className="bg-black">gr (Gramos)</option>
                                                <option value="kg" className="bg-black">kg (Kilogramos)</option>
                                                <option value="pz" className="bg-black">pz (Piezas)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-yellow-500/80">Nota Destacada (Opcional)</Label>
                                        <Input
                                            value={formData.highlightedNote}
                                            onChange={e => setFormData({ ...formData, highlightedNote: e.target.value })}
                                            className="bg-yellow-500/10 border-yellow-500/20 text-yellow-200 placeholder:text-yellow-500/30 focus:border-yellow-500/50"
                                            placeholder="Ej. INCLUYE ENVASE"
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <Label className="text-gray-400">Descripción</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            className="bg-white/5 border-white/10 focus:border-indigo-500 h-20 resize-none"
                                            placeholder="Ingredientes, detalles..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            className={cn(
                                                "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                formData.isFeatured ? "bg-indigo-600 border-indigo-600" : "border-white/20"
                                            )}
                                            onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                                        >
                                            {formData.isFeatured && <Plus className="w-3 h-3 text-white rotate-45" />}
                                        </button>
                                        <span className="text-sm text-gray-300">Marcar como Destacado (Stars)</span>
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
                )}
            </div>
        </div>
    )
}

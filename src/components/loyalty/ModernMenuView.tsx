"use client"

import { useState, useEffect, useRef } from "react"
import { X, Search, ChevronRight, ShoppingBag, Utensils, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getCategories } from "@/actions/products"
import { toast } from "sonner"

interface ModernMenuViewProps {
    userId: string
    onClose: () => void
    businessName: string
}

export function ModernMenuView({ userId, onClose, businessName }: ModernMenuViewProps) {
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState("")
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadData()
    }, [userId])

    async function loadData() {
        setIsLoading(true)
        const res = await getCategories(userId)
        if (res.success) {
            setCategories(res.categories || [])
            if (res.categories && res.categories.length > 0) {
                setActiveCategory(res.categories[0].id)
            }
        } else {
            toast.error("Error al cargar el menú")
        }
        setIsLoading(false)
    }

    const scrollToCategory = (categoryId: string) => {
        setActiveCategory(categoryId)
        const element = categoryRefs.current[categoryId]
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    const filteredCategories = categories.map(cat => ({
        ...cat,
        products: cat.products.filter((p: any) =>
            p.isActive &&
            (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    })).filter(cat => cat.products.length > 0)

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm animate-pulse">Cargando menú...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0a0a0f] text-white flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="relative pt-safe-area pb-4 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 z-20">
                <div className="px-4 flex items-center justify-between mb-4 pt-4">
                    <div>
                        <h2 className="text-lg font-bold">{businessName}</h2>
                        <div className="flex items-center gap-1 text-xs text-green-400">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Abierto ahora
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-4 mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar en el menú..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-600"
                        />
                    </div>
                </div>

                {/* Categories Nav */}
                <div className="px-4 overflow-x-auto scrollbar-hide flex gap-2 pb-2">
                    {filteredCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => scrollToCategory(cat.id)}
                            className={cn(
                                "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                                activeCategory === cat.id
                                    ? "bg-white text-black border-white shadow-lg shadow-white/10 scale-105"
                                    : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Menu Content */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-4 pb-32 pt-4 space-y-8 scroll-smooth"
            >
                {filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                        <Utensils className="w-12 h-12 mb-4" />
                        <p>No se encontraron productos</p>
                    </div>
                ) : (
                    filteredCategories.map(cat => {
                        // Group items
                        const noSubProducts = cat.products.filter((p: any) => !p.subCategoryId)
                        const subCategoriesWithProducts = cat.subCategories?.map((sub: any) => ({
                            ...sub,
                            products: cat.products.filter((p: any) => p.subCategoryId === sub.id)
                        })).filter((sub: any) => sub.products.length > 0) || []

                        return (
                            <div
                                key={cat.id}
                                ref={el => { categoryRefs.current[cat.id] = el }}
                                className="scroll-mt-40"
                            >
                                <h3 className="text-xl font-bold mb-4 sticky top-0 bg-[#0a0a0f]/95 py-2 z-10 backdrop-blur-sm">{cat.name}</h3>

                                <div className="space-y-6">
                                    {/* Products without subcategory */}
                                    {noSubProducts.length > 0 && (
                                        <div className="grid grid-cols-1 gap-4">
                                            {noSubProducts.map((product: any) => (
                                                <ProductCard key={product.id} product={product} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Subcategories */}
                                    {subCategoriesWithProducts.map((sub: any) => (
                                        <div key={sub.id}>
                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1 border-l-2 border-indigo-500">{sub.name}</h4>
                                            <div className="grid grid-cols-1 gap-4">
                                                {sub.products.map((product: any) => (
                                                    <ProductCard key={product.id} product={product} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })
                )}

                <div className="text-center py-8 text-xs text-gray-600">
                    Sujeto a disponibilidad. Precios incluyen impuestos.
                </div>
            </div>

            {/* Floating Action Button (Optional, maybe View Order in future) */}
            <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md rounded-full px-4 py-2 text-xs text-gray-400 border border-white/10 shadow-xl pointer-events-auto flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    <span>Muestra tu tarjeta al ordenar</span>
                </div>
            </div>
        </div>
    )
}

function ProductCard({ product }: { product: any }) {
    return (
        <div className="bg-[#12121a] border border-white/5 rounded-2xl p-3 flex gap-4 active:scale-[0.98] transition-transform duration-200 shadow-sm hover:border-white/10">
            {product.imageUrl && (
                <div className="w-24 h-24 rounded-xl bg-white/5 shrink-0 overflow-hidden">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>
            )}
            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-white text-base leading-tight truncate pr-2">{product.name}</h4>
                        <span className="font-bold text-indigo-400 text-sm whitespace-nowrap">${product.price}</span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {product.description || "Sin descripción disponible."}
                    </p>
                </div>
                <div className="flex justify-end mt-2">
                    <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-indigo-400">
                        <ShoppingBag className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

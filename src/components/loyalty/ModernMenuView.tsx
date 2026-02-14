"use client"

import { useState, useEffect, useRef } from "react"
import { X, Search, ChevronRight, ShoppingBag, Utensils, Info, Star, Flame } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { getCategories } from "@/actions/products"
import { getPromotions } from "@/actions/menu-promotions"
import { toast } from "sonner"
import { ProductDetailModal } from "./ProductDetailModal"

// Swiper
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

interface ModernMenuViewProps {
    userId: string
    onClose: () => void
    businessName: string
}

export function ModernMenuView({ userId, onClose, businessName }: ModernMenuViewProps) {
    const [categories, setCategories] = useState<any[]>([])
    const [promotions, setPromotions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState("")
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([])
    const [selectedProduct, setSelectedProduct] = useState<any>(null)

    // Header scroll state
    const [isScrolled, setIsScrolled] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        loadData()
    }, [userId])

    // Detect scroll for header glass effect
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const offset = e.currentTarget.scrollTop
        setIsScrolled(offset > 20)
    }

    async function loadData() {
        setIsLoading(true)
        try {
            const [catsRes, promosRes] = await Promise.all([
                getCategories(userId),
                getPromotions(userId)
            ])

            if (catsRes.success) {
                const cats = catsRes.categories || []
                setCategories(cats)
                if (cats.length > 0) {
                    setActiveCategory(cats[0].id)
                }

                // Extract featured products from all categories
                const featured: any[] = []
                cats.forEach((cat: any) => {
                    if (cat.products) {
                        cat.products.forEach((prod: any) => {
                            if (prod.isFeatured && prod.isActive) {
                                featured.push(prod)
                            }
                        })
                    }
                })
                setFeaturedProducts(featured)
            }

            setPromotions(promosRes || [])

        } catch (error) {
            toast.error("Error al cargar el menú")
            console.error(error)
        } finally {
            setIsLoading(false)
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
            <div className={cn(
                "relative z-20 transition-all duration-300 border-b border-transparent pb-2",
                isScrolled ? "bg-[#0a0a0f]/90 backdrop-blur-md border-white/5 pt-safe-area shadow-xl" : "bg-transparent pt-safe-area"
            )}>
                <div className="px-4 flex items-center justify-between mb-4 pt-4">
                    <div>
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {businessName}
                        </h2>
                        <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Abierto ahora
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/5 active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar - only show if not scrolled or make it sticky? Keeping it simple for now */}
                <div className="px-4 mb-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="¿Qué se te antoja hoy?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-gray-600"
                        />
                    </div>
                </div>

                {/* Categories Nav */}
                <div className="px-4 overflow-x-auto scrollbar-hide flex gap-2 pb-2">
                    {filteredCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border shrink-0",
                                activeCategory === cat.id
                                    ? "bg-white text-black border-white shadow-lg shadow-white/10 scale-105"
                                    : "bg-white/5 text-gray-400 border-transparent hover:bg-white/10"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Subcategories Nav */}
                {(() => {
                    const currentCat = filteredCategories.find(c => c.id === activeCategory)
                    if (!currentCat?.subCategories?.length) return null

                    return (
                        <div className="px-4 overflow-x-auto scrollbar-hide flex gap-2 pb-2 mt-1 border-t border-white/5 pt-2 animate-in fade-in slide-in-from-top-1">
                            {currentCat.subCategories.map((sub: any) => (
                                <button
                                    key={sub.id}
                                    onClick={() => {
                                        const element = document.getElementById(`sub-${sub.id}`)
                                        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                    }}
                                    className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all active:scale-95 shrink-0"
                                >
                                    {sub.name}
                                </button>
                            ))}
                        </div>
                    )
                })()}
            </div>

            {/* Menu Content */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto pb-32 space-y-8 scroll-smooth"
            >
                {/* Promotions Carousel */}
                {!searchQuery && promotions.length > 0 && (
                    <div className="mt-4">
                        <Swiper
                            modules={[Autoplay, Pagination]}
                            spaceBetween={16}
                            slidesPerView={1.1}
                            centeredSlides={true}
                            loop={promotions.length > 1}
                            autoplay={{ delay: 4000, disableOnInteraction: false }}
                            pagination={{ clickable: true, dynamicBullets: true }}
                            className="w-full px-0"
                        >
                            {promotions.map((promo) => (
                                <SwiperSlide key={promo.id} className="first:pl-4 last:pr-4">
                                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                                        <img src={promo.imageUrl} alt={promo.title || "Promoción"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                                        {promo.title && (
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <h3 className="text-white font-bold text-lg drop-shadow-md">{promo.title}</h3>
                                            </div>
                                        )}
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                )}

                {/* Featured Products "Especial para ti" */}
                {!searchQuery && featuredProducts.length > 0 && (
                    <div className="pl-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                            <h3 className="text-lg font-bold text-white">Especial para ti</h3>
                        </div>
                        <div className="overflow-x-auto scrollbar-hide flex gap-4 pr-4 pb-4">
                            {featuredProducts.map((product) => (
                                <div key={`featured-${product.id}`} className="shrink-0 w-44">
                                    <ProductCard
                                        product={product}
                                        minimal
                                        onClick={() => setSelectedProduct(product)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Menu List */}
                <div className="px-4 pb-20">
                    {filteredCategories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-50">
                            <Utensils className="w-12 h-12 mb-4" />
                            <p>No se encontraron productos</p>
                        </div>
                    ) : (
                        (() => {
                            const currentCat = filteredCategories.find(c => c.id === activeCategory)
                            if (!currentCat) return null

                            const noSubProducts = currentCat.products.filter((p: any) => !p.subCategoryId)
                            const subCategoriesWithProducts = currentCat.subCategories?.map((sub: any) => ({
                                ...sub,
                                products: currentCat.products.filter((p: any) => p.subCategoryId === sub.id)
                            })).filter((sub: any) => sub.products.length > 0) || []

                            return (
                                <div key={currentCat.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-8">
                                        {/* Products without subcategory */}
                                        {noSubProducts.length > 0 && (
                                            <div className="grid grid-cols-1 gap-4">
                                                {noSubProducts.map((product: any) => (
                                                    <ProductCard
                                                        key={product.id}
                                                        product={product}
                                                        onClick={() => setSelectedProduct(product)}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Subcategories */}
                                        {subCategoriesWithProducts.map((sub: any) => (
                                            <div key={sub.id} id={`sub-${sub.id}`} className="scroll-mt-48">
                                                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                                                    <span className="w-1 h-4 bg-indigo-500 rounded-full"></span>
                                                    {sub.name}
                                                </h4>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {sub.products.map((product: any) => (
                                                        <ProductCard
                                                            key={product.id}
                                                            product={product}
                                                            onClick={() => setSelectedProduct(product)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {noSubProducts.length === 0 && subCategoriesWithProducts.length === 0 && (
                                            <div className="text-center py-10 text-gray-600">
                                                <p>No hay productos en esta categoría.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })()
                    )}

                    <div className="text-center py-8 text-xs text-gray-600 mt-8 border-t border-white/5 pt-8">
                        <p className="mb-1">Sujeto a disponibilidad. Precios incluyen impuestos.</p>
                        <p>© {new Date().getFullYear()} {businessName}</p>
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center pointer-events-none z-30">
                <div className="bg-black/80 backdrop-blur-xl rounded-full px-5 py-2.5 text-xs font-medium text-white border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-2 hover:bg-black transition-colors">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Muestra tu código QR al ordenar</span>
                </div>
            </div>

            {/* Gradient Overlay bottom */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none z-10" />

            {/* Product Detail Modal */}
            <ProductDetailModal
                isOpen={!!selectedProduct}
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                customerId={userId} // TODO: This might be the business ID in preview mode, but we need customer ID for real reviews.
            />
        </div>
    )
}

function ProductCard({ product, minimal = false, onClick }: { product: any, minimal?: boolean, onClick?: () => void }) {
    if (minimal) {
        return (
            <div
                onClick={onClick}
                className="bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden active:scale-95 transition-all duration-200 h-full flex flex-col hover:border-white/10 group shadow-lg cursor-pointer"
            >
                <div className="aspect-[4/3] bg-white/5 relative overflow-hidden">
                    {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="w-6 h-6 text-gray-700" />
                        </div>
                    )}
                    {product.isFeatured && (
                        <div className="absolute top-2 left-2 bg-yellow-400/90 backdrop-blur text-black p-1 rounded-full shadow-lg z-10">
                            <Star className="w-2.5 h-2.5 fill-black" />
                        </div>
                    )}
                    {product.highlightedNote && (
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-[#FFD700] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#FFD700]/20 max-w-[90%] truncate">
                            {product.highlightedNote}
                        </div>
                    )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                    <h4 className="font-bold text-white text-sm line-clamp-1 mb-1">{product.name}</h4>
                    <div className="flex justify-between items-center mt-auto">
                        <div className="flex flex-col">
                            <span className="font-bold text-indigo-400 text-sm">${product.price}</span>
                            {product.size && product.unit && (
                                <span className="text-[10px] text-gray-500">{product.size} {product.unit}</span>
                            )}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/50 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <ShoppingBag className="w-3 h-3" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            onClick={onClick}
            className="bg-[#12121a] border border-white/5 rounded-2xl p-3 flex gap-4 active:scale-[0.98] transition-all duration-200 shadow-sm hover:border-white/10 group hover:bg-white/[0.02] cursor-pointer"
        >
            {product.imageUrl && (
                <div className="w-24 h-24 rounded-xl bg-white/5 shrink-0 overflow-hidden relative">
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                    {product.isFeatured && (
                        <div className="absolute top-1 left-1 bg-yellow-400 text-black p-1 rounded-full shadow-lg z-10">
                            <Star className="w-2 h-2 fill-black" />
                        </div>
                    )}
                </div>
            )}
            <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <div className="min-w-0 pr-2">
                            <h4 className="font-bold text-white text-base leading-tight truncate">{product.name}</h4>
                            {product.highlightedNote && (
                                <p className="text-[#FFD700] text-[10px] font-bold tracking-wide uppercase mt-0.5">
                                    {product.highlightedNote}
                                </p>
                            )}
                        </div>
                        <div className="text-right shrink-0">
                            <div className="font-bold text-indigo-400 text-sm whitespace-nowrap">${product.price}</div>
                            {product.size && product.unit && (
                                <div className="text-[10px] text-gray-500 whitespace-nowrap">{product.size} {product.unit}</div>
                            )}
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {product.description || "Sin descripción disponible."}
                    </p>
                </div>
                <div className="flex justify-end mt-2">
                    <button className="p-2 bg-white/5 rounded-full hover:bg-indigo-600 hover:text-white transition-colors text-indigo-400">
                        <ShoppingBag className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

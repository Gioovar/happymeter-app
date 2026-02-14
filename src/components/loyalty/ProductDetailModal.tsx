'use client'

import { useState, useEffect } from "react"
import { X, Star, MessageSquare, Plus, Minus, ShoppingBag, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { submitProductReview, getProductReviews } from "@/actions/loyalty/product-reviews"
import { toast } from "sonner"
import Image from "next/image"

interface ProductDetailModalProps {
    product: any
    isOpen: boolean
    onClose: () => void
    onAddToCart?: (product: any, quantity: number, notes: string) => void
    customerId?: string
}

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart, customerId }: ProductDetailModalProps) {
    const [quantity, setQuantity] = useState(1)
    const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')
    const [reviews, setReviews] = useState<any[]>([])
    const [isLoadingReviews, setIsLoadingReviews] = useState(false)

    // New Review State
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen && product?.id) {
            loadReviews()
            setQuantity(1)
            setActiveTab('details')
        }
    }, [isOpen, product])

    const loadReviews = async () => {
        setIsLoadingReviews(true)
        const res = await getProductReviews(product.id)
        if (res.success) {
            setReviews(res.reviews || [])
        }
        setIsLoadingReviews(false)
    }

    const handleSubmitReview = async () => {
        if (!customerId) {
            toast.error("Debes iniciar sesión para calificar")
            return
        }

        setIsSubmitting(true)
        const res = await submitProductReview(product.id, rating, comment, customerId)

        if (res.success) {
            toast.success("¡Gracias por tu opinión!")
            setComment("")
            setRating(5)
            loadReviews()
        } else {
            toast.error(res.error || "Error al enviar reseña")
        }
        setIsSubmitting(false)
    }

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : null

    if (!isOpen || !product) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        className="fixed inset-x-0 bottom-0 top-10 md:inset-10 z-[70] bg-[#111] md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col max-w-4xl mx-auto border border-white/10"
                    >
                        {/* Header Image */}
                        <div className="relative h-64 md:h-80 shrink-0">
                            <Image
                                src={product.imageUrl || "/placeholder-food.jpg"}
                                alt={product.name}
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-black/50" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors border border-white/10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                <div className="flex justify-between items-end gap-4">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">{product.name}</h2>
                                        {product.highlightedNote && (
                                            <div className="mb-2">
                                                <span className="text-[#FFD700] font-bold text-sm tracking-wide uppercase bg-[#FFD700]/10 px-3 py-1 rounded-lg border border-[#FFD700]/20">
                                                    ✨ {product.highlightedNote}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            {averageRating ? (
                                                <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-yellow-500 font-bold">{averageRating}</span>
                                                    <span className="text-gray-400 text-xs">({reviews.length})</span>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 bg-white/5 px-2 py-1 rounded-lg">Nuevo Producto</div>
                                            )}
                                            <div className="flex items-baseline gap-2">
                                                <div className="text-green-400 font-bold text-xl md:text-2xl">${product.price}</div>
                                                {product.size && product.unit && (
                                                    <div className="text-gray-400 text-sm font-medium">
                                                        / {product.size} {product.unit}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto bg-[#111]">
                            {/* Tabs */}
                            <div className="flex border-b border-white/10 sticky top-0 bg-[#111]/90 backdrop-blur-md z-10">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={cn(
                                        "flex-1 py-4 text-sm font-medium transition-colors relative",
                                        activeTab === 'details' ? "text-white" : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    Detalles
                                    {activeTab === 'details' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={cn(
                                        "flex-1 py-4 text-sm font-medium transition-colors relative",
                                        activeTab === 'reviews' ? "text-white" : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    Opiniones ({reviews.length})
                                    {activeTab === 'reviews' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />}
                                </button>
                            </div>

                            <div className="p-6 md:p-8">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'details' ? (
                                        <motion.div
                                            key="details"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="prose prose-invert max-w-none">
                                                <p className="text-gray-300 text-lg leading-relaxed">{product.description}</p>
                                            </div>

                                            {/* AI Insight Mockup */}
                                            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-4 flex gap-4 items-start">
                                                <div className="p-2 bg-indigo-500/20 rounded-xl mt-1">
                                                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-indigo-300 mb-1">Análisis de IA</h4>
                                                    <p className="text-sm text-indigo-200/80">
                                                        Este producto es el favorito de los clientes los fines de semana. Se recomienda maridarlo con nuestras bebidas cítricas.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Ingredients / Technical Details Mock */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Calorías</div>
                                                    <div className="text-white font-mono">~450 kcal</div>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Tiempo prep.</div>
                                                    <div className="text-white font-mono">15-20 min</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="reviews"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-8"
                                        >
                                            {/* Review Form */}
                                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                                <h3 className="font-bold text-white mb-4">Escribe tu opinión</h3>
                                                <div className="flex gap-2 mb-4">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setRating(s)}
                                                            className="focus:outline-none transition-transform hover:scale-110"
                                                        >
                                                            <Star
                                                                className={cn(
                                                                    "w-8 h-8 transition-colors",
                                                                    s <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-600"
                                                                )}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={comment}
                                                    onChange={e => setComment(e.target.value)}
                                                    placeholder="¿Qué te pareció este producto?"
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none mb-4"
                                                />
                                                <button
                                                    onClick={handleSubmitReview}
                                                    disabled={isSubmitting || comment.length < 3}
                                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isSubmitting ? "Enviando..." : "Publicar Reseña"}
                                                </button>
                                            </div>

                                            {/* Reviews List */}
                                            <div className="space-y-4">
                                                {isLoadingReviews ? (
                                                    <div className="text-center py-8 text-gray-500">Cargando opiniones...</div>
                                                ) : reviews.length > 0 ? (
                                                    reviews.map((review) => (
                                                        <div key={review.id} className="border-b border-white/5 pb-6 last:border-0">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center font-bold text-xs text-white">
                                                                        {review.customer?.name?.[0] || 'C'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-bold text-white">{review.customer?.name || 'Cliente'}</div>
                                                                        <div className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                                        <Star
                                                                            key={s}
                                                                            className={cn(
                                                                                "w-3 h-3",
                                                                                s <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-700"
                                                                            )}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500 italic">
                                                        Este producto aún no tiene reseñas. ¡Sé el primero!
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer / Add to Cart */}
                        <div className="p-4 md:p-6 bg-[#111] border-t border-white/10 shrink-0">
                            <div className="flex gap-4">
                                <div className="flex items-center bg-white/5 rounded-xl border border-white/10">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/5 transition-colors rounded-l-xl"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <div className="w-8 text-center font-bold text-lg text-white">{quantity}</div>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/5 transition-colors rounded-r-xl"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => onAddToCart?.(product, quantity, "")}
                                    className="flex-1 bg-white text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span>Agregar</span>
                                    <span className="bg-black/10 px-2 py-0.5 rounded text-sm">${(product.price * quantity).toFixed(2)}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

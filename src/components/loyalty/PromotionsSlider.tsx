"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PromotionsSliderProps {
    promotions: any[]
}

export function PromotionsSlider({ promotions }: PromotionsSliderProps) {
    const [mounted, setMounted] = useState(false)
    const [selectedPromo, setSelectedPromo] = useState<any>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || !promotions || promotions.length === 0) return null

    return (
        <>
            {/* Native CSS Scroll Snap Slider for better mobile stability */}
            <div className="w-full mt-6 relative z-0">
                <div className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl shadow-lg border border-white/5 scrollbar-hide aspect-[21/9]">
                    {promotions.map((promo) => (
                        <div
                            key={promo.id}
                            className="snap-center shrink-0 w-full h-full relative group cursor-pointer"
                            onClick={() => setSelectedPromo(promo)}
                        >
                            <img
                                src={promo.imageUrl}
                                alt={promo.title || "Promoción"}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
                                {promo.title && (
                                    <>
                                        <h3 className="text-white font-bold text-lg md:text-xl mb-1 line-clamp-1">{promo.title}</h3>
                                        {promo.description && (
                                            <p className="text-white/80 text-xs md:text-sm line-clamp-1">{promo.description}</p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* View Details Badge */}
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                <span className="text-white text-xs font-semibold">Ver Detalles</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dots indicator */}
                {promotions.length > 1 && (
                    <div className="flex justify-center gap-2 mt-3">
                        {promotions.map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selectedPromo} onOpenChange={(open) => !open && setSelectedPromo(null)}>
                <DialogContent className="bg-[#111] border-white/10 p-0 overflow-hidden max-w-md">
                    {selectedPromo && (
                        <div className="flex flex-col">
                            <div className="relative w-full aspect-video">
                                <img
                                    src={selectedPromo.imageUrl}
                                    alt={selectedPromo.title}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={() => setSelectedPromo(null)}
                                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-md transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <h2 className="text-2xl font-bold text-white mb-2">{selectedPromo.title}</h2>

                                {selectedPromo.description && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Descripción</h4>
                                        <p className="text-gray-300 leading-relaxed">{selectedPromo.description}</p>
                                    </div>
                                )}

                                {selectedPromo.terms && (
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex items-start gap-3">
                                            <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-bold text-white mb-1">Términos y Condiciones</h4>
                                                <p className="text-xs text-gray-400 leading-relaxed">{selectedPromo.terms}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <Button
                                        className="w-full bg-white text-black hover:bg-gray-200 font-bold"
                                        onClick={() => setSelectedPromo(null)}
                                    >
                                        Entendido
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

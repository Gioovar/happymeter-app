'use client'

import { useState } from 'react'
import { X, ArrowRight } from 'lucide-react'

export default function ResponseClientView({ photoUrl }: { photoUrl: string }) {
    const [showImage, setShowImage] = useState(false)

    return (
        <div className="space-y-3">
            {/* Lightbox for Image */}
            {showImage && (
                <div
                    className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowImage(false)
                    }}
                >
                    <button
                        onClick={() => setShowImage(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={photoUrl}
                        alt="Evidencia del cliente"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">FOTO DE EXPERIENCIA</h4>
            <div
                className="relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-white/10 bg-[#111] hover:border-violet-500/30 transition-all w-full h-48"
                onClick={() => setShowImage(true)}
            >
                <img
                    src={photoUrl}
                    alt="Evidencia"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                </div>
            </div>
        </div>
    )
}

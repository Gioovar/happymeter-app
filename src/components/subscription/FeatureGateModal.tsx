'use client'

import { X, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'

interface FeatureGateModalProps {
    isOpen: boolean
    onClose: () => void
    featureName?: string
    title?: string
    description?: string
    benefits?: string[]
}

export default function FeatureGateModal({ 
    isOpen, 
    onClose, 
    featureName = "Función Premium",
    title = "Mejora tu plan para acceder",
    description = "Esta función está disponible exclusivamente en nuestros planes de pago.",
    benefits = ["Acceso ilimitado", "Soporte prioritario", "Análisis avanzado"]
}: FeatureGateModalProps) {
    const router = useRouter()

    if (!isOpen) return null

    // Use portal to ensure it stays on top of everything
    if (typeof window === 'undefined') return null

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* Background Gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10 p-8">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                                <span className="text-2xl">✨</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                            <p className="text-gray-400 leading-relaxed">
                                {description}
                            </p>
                        </div>

                        <div className="space-y-3 mb-8">
                            {benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-3 text-sm text-gray-300">
                                    <div className="p-1 rounded-full bg-green-500/20 text-green-400">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    {benefit}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    router.push('/dashboard/settings')
                                    onClose()
                                }}
                                className="flex-1 bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                Hacer Upgrade
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Quizás luego
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    )
}

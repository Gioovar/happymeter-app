'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react'
import { completeTour } from '@/actions/user'
import { useRouter } from 'next/navigation'

const TOUR_STEPS = [
    {
        target: 'welcome-modal', // Special ID for center modal
        title: '¡Bienvenido a HappyMeter! 👋',
        description: 'Estamos emocionados de que estés aquí. Te daremos un recorrido rápido de 30 segundos para que aproveches al máximo la plataforma.',
        position: 'center'
    },
    {
        target: 'create-survey-btn',
        title: 'Crea tu Primera Encuesta',
        description: 'Aquí comienza todo. Haz clic aquí para generar encuestas de satisfacción, obtener tu QR y enlace para compartir.',
        position: 'bottom-left'
    },
    {
        target: 'analytics-card',
        title: 'Mide la Felicidad',
        description: 'Consulta en tiempo real el NPS (Net Promoter Score) y la satisfacción general de tus clientes.',
        position: 'center'
    },
    {
        target: 'ai-chat-btn', // Needs to be added to sidebar
        title: 'Tu Asistente IA',
        description: '¿No sabes qué preguntar? Habla con nuestra IA para generar preguntas, analizar comentarios o pedir consejos de marketing.',
        position: 'right'
    }
]

export default function FeatureTour() {
    const [step, setStep] = useState(0)
    const [isVisible, setIsVisible] = useState(true)
    const router = useRouter()

    const currentStep = TOUR_STEPS[step]

    const handleNext = async () => {
        if (step < TOUR_STEPS.length - 1) {
            setStep(step + 1)
        } else {
            await handleFinish()
        }
    }

    const handleFinish = async () => {
        setIsVisible(false)
        await completeTour()
        // Optional: Trigger confetti or something
    }

    // Helper to calculate position based on target element
    // Ideally this would use getBoundingClientRect but for simplicity we'll use fixed overlays for now
    // or passed IDs.

    if (!isVisible) return null

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-[2px]"
            >
                {/* Spotlight Logic would go here (complex for V1), using simple centered cards for V1 */}

                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <motion.div
                        key={step}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: -20 }}
                        className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative"
                    >
                        {/* Progress Bar */}
                        <div className="h-1 bg-white/5 w-full">
                            <motion.div
                                className="h-full bg-violet-500"
                                initial={{ width: `${(step / TOUR_STEPS.length) * 100}%` }}
                                animate={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
                            />
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
                                <Sparkles className="w-6 h-6" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-white">{currentStep.title}</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {currentStep.description}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4">
                                <button
                                    onClick={handleFinish}
                                    className="text-sm text-gray-500 hover:text-white transition"
                                >
                                    Saltar tour
                                </button>

                                <button
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition flex items-center gap-2"
                                >
                                    {step === TOUR_STEPS.length - 1 ? '¡Entendido!' : 'Siguiente'}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                            {TOUR_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-white' : 'bg-white/20'}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Optional: Highlight placeholders could receive coordinates here */}
            </motion.div>
        </AnimatePresence>
    )
}

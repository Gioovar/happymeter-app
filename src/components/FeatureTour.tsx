'use client'

import { useState, useEffect, useLayoutEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, Sparkles } from 'lucide-react'
import { completeTour } from '@/actions/user'
import { createPortal } from 'react-dom'

const TOUR_STEPS = [
    {
        target: null, // Center Modal
        title: '¡Bienvenido a HappyMeter! 👋',
        description: 'Estamos emocionados de que estés aquí. Te daremos un recorrido rápido para que domines la plataforma en segundos.',
        position: 'center'
    },
    {
        target: 'nav-item-crear-nueva',
        title: 'Crea tu Primera Encuesta',
        description: 'Aquí es donde ocurre la magia. Crea encuestas ilimitadas, obtén tu QR y comienza a medir la satisfacción.',
        position: 'right'
    },
    {
        target: 'nav-item-mis-encuestas',
        title: 'Tu Panel de Control',
        description: 'Aquí verás todas tus encuestas activas, podrás pausarlas, editarlas y ver sus resultados individuales.',
        position: 'right'
    },
    {
        target: 'nav-item-ai-chat',
        title: 'Tu Asistente IA 🤖',
        description: '¿Necesitas ideas? Pídele a nuestra IA que genere preguntas, analice comentarios o te dé consejos de mejora.',
        position: 'right'
    }
]

export default function FeatureTour() {
    const [step, setStep] = useState(0)
    const [isVisible, setIsVisible] = useState(true)
    const [rect, setRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Prevent scrolling while tour is active
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    const currentStep = TOUR_STEPS[step]

    // Measure target element
    const measure = useCallback(() => {
        if (!currentStep.target) {
            setRect(null)
            return
        }

        const el = document.getElementById(currentStep.target)
        if (el) {
            const r = el.getBoundingClientRect()
            setRect({
                top: r.top,
                left: r.left,
                width: r.width,
                height: r.height
            })
        } else {
            // Element not found (maybe mobile menu closed?), fallback to center or skip
            setRect(null)
        }
    }, [currentStep.target])

    useLayoutEffect(() => {
        measure()
        window.addEventListener('resize', measure)
        return () => window.removeEventListener('resize', measure)
    }, [measure, step])

    const handleNext = async () => {
        if (step < TOUR_STEPS.length - 1) {
            setStep(step + 1)
        } else {
            await handleFinish()
        }
    }

    const handleFinish = async () => {
        setIsVisible(false)
        document.body.style.overflow = 'unset'
        await completeTour()
    }

    if (!isVisible || !mounted) return null

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] isolate"
            >
                {/* 
                    Spotlight Logic:
                    If we have a rect, we use a "hole" with box-shadow.
                    If no rect (step 0), we just use a dark background.
                */}

                {rect ? (
                    <motion.div
                        className="absolute inset-0 pointer-events-none text-black/80 transition-all duration-500 ease-in-out"
                        style={{
                            // Create the "hole" at the specific position
                            // We construct a massive box shadow around a transparent div
                        }}
                    >
                        {/* The Hole */}
                        <div
                            className="absolute rounded-xl transition-all duration-300 ease-in-out box-content border-2 border-violet-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.85)]"
                            style={{
                                top: rect.top - 4,
                                left: rect.left - 4,
                                width: rect.width + 8,
                                height: rect.height + 8,
                            }}
                        />
                    </motion.div>
                ) : (
                    // Full backdrop for center modal
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-colors duration-500" />
                )}

                {/* Content Card */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="pointer-events-auto absolute"
                        style={
                            rect
                                ? {
                                    top: rect.top + (rect.height / 2) - 100, // Roughly center vertically relative to item, or adjust
                                    left: rect.left + rect.width + 24, // To the right of the item
                                    // Handle if it goes off screen? For sidebar (left), typically plenty of space on right.
                                }
                                : {
                                    // Center positioning
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '100%',
                                    maxWidth: '420px'
                                }
                        }
                    >
                        {/* Card Design */}
                        <div className={`
                            bg-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden
                            ${rect ? 'w-80 rounded-xl' : 'w-full max-w-md rounded-2xl -translate-x-1/2 -translate-y-1/2'}
                         `}>
                            {/* Progress (Only for card, not modal loop if desired, but consistent is good) */}
                            <div className="h-1 bg-white/5 w-full">
                                <motion.div
                                    className="h-full bg-violet-500"
                                    initial={{ width: `${(step / TOUR_STEPS.length) * 100}%` }}
                                    animate={{ width: `${((step + 1) / TOUR_STEPS.length) * 100}%` }}
                                />
                            </div>

                            <div className="p-6">
                                {!rect && (
                                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                )}

                                <div className="space-y-2 mb-6">
                                    <h3 className="text-xl font-bold text-white pr-8">{currentStep.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {currentStep.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <button
                                        onClick={handleFinish}
                                        className="text-xs text-gray-500 hover:text-white transition px-2 py-2"
                                    >
                                        Saltar
                                    </button>

                                    <button
                                        onClick={handleNext}
                                        className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                                    >
                                        {step === TOUR_STEPS.length - 1 ? '¡Listo!' : 'Siguiente'}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Dots */}
                            <div className="absolute top-6 right-6 flex gap-1">
                                {TOUR_STEPS.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === step ? 'bg-violet-500' : 'bg-white/10'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    )
}

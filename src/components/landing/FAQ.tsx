
'use client'

import { useState } from 'react'
import { MessageSquare, Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
    {
        question: "¿Es realmente gratis?",
        answer: "¡Sí! Tenemos un plan gratuito generoso para que empieces. Solo pagas si necesitas funciones avanzadas o más volumen."
    },
    {
        question: "¿Necesito saber programar?",
        answer: "Para nada. HappyMeter es 'No-Code'. Creas tu encuesta en 2 minutos y listo."
    },
    {
        question: "¿Cómo funcionan los reportes de WhatsApp?",
        answer: "Conectas tu número y nuestra IA te envía un resumen PDF cada semana con lo más importante."
    },
    {
        question: "¿Puedo personalizar los colores?",
        answer: "Absolutamente. Puedes adaptar la encuesta a la identidad de tu marca (logo, colores, textos)."
    }
]

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-400 text-sm font-bold mb-6">
                        <MessageSquare className="w-4 h-4" />
                        <span>Preguntas Frecuentes</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white">Resolvemos tus dudas</h2>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            className="group cursor-pointer rounded-2xl bg-[#111] border border-white/5 hover:border-violet-500/30 transition duration-300 overflow-hidden"
                        >
                            <div className="p-6 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-white group-hover:text-violet-300 transition">
                                    {faq.question}
                                </h3>
                                <div className={`p-2 rounded-full bg-white/5 transition duration-300 ${openIndex === index ? 'rotate-180 bg-violet-500/20 text-violet-400' : 'text-gray-400'}`}>
                                    {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                </div>
                            </div>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

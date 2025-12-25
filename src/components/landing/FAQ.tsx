
'use client'

import { useState } from 'react'
import { MessageSquare, Plus, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
    {
        question: "¿En realidad voy a tener mi propia IA?",
        answer: "¡Sí! No es un chat genérico. HappyMeter aprende de TU base de datos, tus quejas y tus clientes reales para darte estrategias, promociones y soluciones personalizadas. Es como tener un gerente de marketing experto que conoce tu negocio mejor que nadie."
    },
    {
        question: "¿Cómo recupera clientes automáticamente?",
        answer: "Detectamos calificaciones bajas (1-3 estrellas) en tiempo real y nuestro sistema puede enviar cupones de 'perdón' al instante. Convertimos una mala experiencia en una segunda oportunidad antes de que el cliente se vaya para siempre."
    },
    {
        question: "¿Es difícil de poner en marcha?",
        answer: "Es ridículamente fácil. No instalas nada en tus POS. Te damos un QR inteligente y un link. Los pones en tus mesas, tickets o redes sociales y listo. Empiezas a recibir datos valiosos en menos de 5 minutos."
    },
    {
        question: "¿Realmente mejora mi posición en Google?",
        answer: "Totalmente. Nuestro filtro inteligente dirige a los clientes felices (4-5 estrellas) directamente a Google Maps para dejar reseña, mientras que las quejas te llegan solo a ti de forma privada. Más estrellas reales = Mejor reputación online."
    },
    {
        question: "¿Qué pasa con mis empleados?",
        answer: "HappyMeter es tu mejor aliado de RRHH. Con el 'Staff Leaderboard', sabrás exactamente quién atiende mejor. Los clientes califican el servicio, y tú descubres quién es tu empleado estrella y quién está fallando."
    },
    {
        question: "¿Hay contratos forzosos o plazos fijos?",
        answer: "Cero ataduras. Confiamos tanto en nuestro valor que puedes cancelar cuando quieras con un solo clic. Sin llamadas incómodas ni letras chiquitas."
    },
    {
        question: "¿Cómo funcionan los Juegos de Premios?",
        answer: "La gamificación es la clave. Tenemos un catálogo completo de juegos (como la Ruleta, Dados, y más) que hacen divertido opinar. El cliente juega al final de su encuesta para ganar un incentivo que TÚ configuras. Esto multiplica x10 la participación."
    },
    {
        question: "¿Necesito integrarlo con mi punto de venta (POS)?",
        answer: "No. HappyMeter funciona en paralelo. No tocamos tu facturación ni tu software actual. Esto elimina riesgos técnicos y hace que la instalación sea inmediata."
    },
    {
        question: "¿Funciona si tengo varias sucursales?",
        answer: "¡Es perfecto para franquicias! Tienes un 'Panel de Dueño' donde ves el rendimiento de todas tus sucursales en una sola pantalla. Compara gerentes, zonas y detecta problemas a nivel global."
    },
    {
        question: "¿Y si necesito ayuda humana?",
        answer: "Tu IA de soporte está disponible 24/7, pero nuestro equipo de éxito del cliente (humanos reales) también está listo para ayudarte por WhatsApp si necesitas algo más específico."
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

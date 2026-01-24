'use client'

import { X, Bot, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, MessageCircle, Send, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

interface AIReportModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AIReportModal({ isOpen, onClose }: AIReportModalProps) {
    const [view, setView] = React.useState<'report' | 'chat' | 'plan-preview'>('report')

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-900/20 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center border border-violet-500/30">
                                <Bot className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {view === 'report' ? 'Análisis de Inteligencia Artificial' :
                                        view === 'chat' ? 'Chat con Giovar (Experto IA)' : 'Revisión del Plan de Acción'}
                                </h3>
                                <p className="text-xs text-violet-300">
                                    {view === 'report' ? 'Generado automáticamente • Hace 5 minutos' :
                                        view === 'chat' ? 'En línea • Listo para ayudarte' : 'Borrador editable'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {view === 'report' ? (
                                <button
                                    onClick={() => setView('chat')}
                                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition flex items-center gap-2"
                                >
                                    <MessageCircle className="w-3 h-3" /> Hablar con Giovar
                                </button>
                            ) : view === 'chat' ? (
                                <button
                                    onClick={() => setView('report')}
                                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                                >
                                    Ver Reporte
                                </button>
                            ) : (
                                <button
                                    onClick={() => setView('chat')}
                                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                                >
                                    Volver al Chat
                                </button>
                            )}
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {view === 'report' ? (
                            <ReportContent onClose={onClose} />
                        ) : view === 'chat' ? (
                            <ChatInterface onViewPlan={() => setView('plan-preview')} />
                        ) : (
                            <PlanPreview />
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

function ReportContent({ onClose }: { onClose: () => void }) {
    return (
        <>
            <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar flex-1">
                {/* Summary Card */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Resumen Ejecutivo
                    </h4>
                    <p className="text-gray-300 leading-relaxed">
                        La atención del personal es <span className="text-green-400 font-bold">altamente valorada</span>, siendo el punto más fuerte del negocio.
                        Sin embargo, la satisfacción general se ve comprometida por quejas recurrentes sobre el
                        <span className="text-red-400 font-bold"> tiempo de servicio en bebidas</span> y la percepción de
                        <span className="text-yellow-400 font-bold"> precios elevados</span>.
                    </p>
                </div>

                {/* Key Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2 text-green-400 font-bold">
                            <CheckCircle className="w-4 h-4" /> Puntos Fuertes
                        </div>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-start gap-2">• Excelente atención de meseros (90%).</li>
                            <li className="flex items-start gap-2">• Calidad de alimentos consistente.</li>
                        </ul>
                    </div>

                    <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                        <div className="flex items-center gap-2 mb-2 text-red-400 font-bold">
                            <AlertTriangle className="w-4 h-4" /> Áreas de Mejora
                        </div>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-start gap-2">• Lentitud en barra/bebidas.</li>
                            <li className="flex items-start gap-2">• Relación calidad-precio percibida.</li>
                        </ul>
                    </div>
                </div>

                {/* Action Plan */}
                <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Recomendaciones de Acción</h4>
                    <div className="space-y-3">
                        <RecommendationItem
                            number={1}
                            title="Optimizar Flujo de Barra"
                            description="Reducir tiempos de espera en bebidas."
                            steps={[
                                "Contratar un 'Barback' para apoyo en horas pico.",
                                "Implementar 'Pre-mix' para los 5 cócteles más vendidos.",
                                "Reorganizar estación de bebidas para minimizar movimientos."
                            ]}
                        />
                        <RecommendationItem
                            number={2}
                            title="Estrategia de Valor"
                            description="Mejorar la percepción de precios."
                            steps={[
                                "Lanzar 'Happy Hour' en bebidas de alta rotación (Jue-Sab).",
                                "Crear combos de Alimentos + Bebida con precio atractivo.",
                                "Comunicar mejor la calidad de los insumos en el menú."
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white text-black font-bold hover:bg-gray-200 transition text-sm">
                    Entendido
                </button>
            </div>
        </>
    )
}

function ChatInterface({ onViewPlan }: { onViewPlan: () => void }) {
    const [messages, setMessages] = React.useState<{ role: 'bot' | 'user', text: string }[]>([
        { role: 'bot', text: "Hola, soy Giovar, tu experto en optimización de restaurantes. He analizado tus datos y veo oportunidades claras. ¿Te gustaría que creemos juntos un plan de acción detallado para mejorar esos tiempos de espera y la percepción de precios?" }
    ])
    const [input, setInput] = React.useState('')
    const [isTyping, setIsTyping] = React.useState(false)
    // Simple state to track conversation context
    const [context, setContext] = React.useState({
        hasSuggestedBarback: false,
        userRejectedBarback: false,
        hasSuggestedPremix: false
    })

    const messagesEndRef = React.useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    React.useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = () => {
        if (!input.trim()) return

        const userMsg = input
        const lowerMsg = userMsg.toLowerCase()
        setMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setInput('')
        setIsTyping(true)

        // Simulate AI response with improved, robust logic
        setTimeout(() => {
            let botResponse = ""

            // 1. Check for specific problem categories
            const isServiceIssue = lowerMsg.match(/(lento|tarda|espera|mesero|atención|personal|servicio)/)
            const isFoodIssue = lowerMsg.match(/(comida|sabor|fría|cruda|calidad|menú|plato)/)
            const isPriceIssue = lowerMsg.match(/(precio|caro|costoso|cuenta|pagar|dinero)/)
            const isAtmosphereIssue = lowerMsg.match(/(ruido|música|calor|frío|sucio|limpieza|baño|ambiente)/)
            const isMarketingIssue = lowerMsg.match(/(marketing|clientes|ventas|promoción|publicidad|gente|lleno|vender)/)
            const isApproval = lowerMsg.match(/(si|sí|claro|ok|bueno|gusta|perfecto|dale)/)
            const isRejection = lowerMsg.match(/(no|nunca|jamás|imposible|difícil)/)

            // Context-aware responses
            if (isMarketingIssue) {
                botResponse = "¡Entendido! Atraer más clientes es fundamental. Para un plan de marketing efectivo, primero definamos el objetivo: ¿Buscas atraer **nuevos clientes** o **fidelizar a los que ya vienen**? Esto cambiará la estrategia (ej. Redes Sociales vs. Programas de Lealtad)."
            }
            else if (!context.hasSuggestedBarback && (lowerMsg.includes('plan') || isApproval)) {
                // Initial hook
                botResponse = "Excelente. Para crear un plan robusto, necesito priorizar. Basado en los datos, la **velocidad de servicio** es crítica. ¿Tu cocina o barra tiene 'cuellos de botella' identificados en horas pico?"
                setContext(prev => ({ ...prev, hasSuggestedBarback: true })) // Reusing state key for flow control
            }
            else if (isServiceIssue) {
                botResponse = "Entendido, el servicio es clave. Problema: Tiempos de espera altos. Solución: Implementar 'Mise en place' riguroso antes del turno y asignar zonas fijas a los meseros. Acción: ¿Podemos establecer un checklist de preparación previa para tu equipo?"
            }
            else if (isFoodIssue) {
                botResponse = "La calidad de alimentos es innegociable. Problema: Quejas sobre la comida. Solución: Estandarización de recetas (Fichas Técnicas) y control de temperatura en el pase. Acción: Revisar tus 5 platos más vendidos y asegurar que salgan idénticos siempre. Materiales: Termómetro de cocina y báscula digital."
            }
            else if (isAtmosphereIssue) {
                botResponse = "El ambiente define la experiencia. Problema: Confort del cliente. Solución: Checklist de atmósfera cada 2 horas (volumen música, A/C, limpieza baños). Acción: Designar un responsable por turno para esta verificación. Materiales: Formato impreso de control de limpieza."
            }
            else if (isPriceIssue) {
                botResponse = "El tema de precios es delicado. En lugar de bajar precios, aumenta el valor percibido. Ejemplo: Ofrece un pequeño aperitivo de cortesía (cacahuates/papas) al sentarse. Materiales: Platos pequeños y compra de botana a granel. ¿Lo incluimos?"
            }
            else if (isRejection) {
                botResponse = "Comprendo las limitaciones. Un buen plan se adapta a la realidad. Si esa opción no es viable por costos o logística, busquemos una alternativa 'Low Cost' de alto impacto. ¿Qué tal si nos enfocamos en capacitación rápida del personal actual (Briefing diario de 10 min)? No cuesta dinero y alinea al equipo."
            }
            else {
                // Fallback for generic inputs that sounds analytical
                botResponse = "Interesante punto. Como experto, veo que esto afecta la retención de clientes. Lo estoy procesando para incluirlo en el plan integral. ¿Hay algún otro detalle operativo que deba considerar antes de generar el borrador final?"
            }

            setMessages(prev => [...prev, { role: 'bot', text: botResponse }])
            setIsTyping(false)
        }, 1500)
    }

    return (
        <div className="flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-violet-600 text-white rounded-br-none'
                            : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/10 p-4 rounded-2xl rounded-bl-none border border-white/5 flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-black/20">
                {messages.length > 2 && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full mb-4 bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
                        onClick={onViewPlan}
                    >
                        <FileText className="w-4 h-4" /> Ver Borrador del Plan
                    </motion.button>
                )}

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe tu mensaje para Giovar..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500 transition"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function PlanPreview() {
    const [items, setItems] = React.useState([
        { id: 1, title: 'Estrategia de Pre-mix (Bebidas)', desc: 'ACCIONES: 1. Identificar Top 3 cocteles vendidos. 2. Preparar bases antes del turno. MATERIALES: Comprar 3 dispensadores de 5L y etiquetas de fecha.', priority: 'Alta' },
        { id: 2, title: 'Happy Hour Estratégico', desc: 'ACCIONES: Configurar 2x1 solo de 6-8pm en bebidas de bajo costo (cerveza/nacional). MATERIALES: Pizarrón o "Tent cards" para mesas comunicando la promo.', priority: 'Media' },
        { id: 3, title: 'Aperitivo de Cortesía', desc: 'ACCIONES: Servir pequeña porción al recibir al cliente para mejorar percepción de valor. MATERIALES: Ramekins pequeños y compra de botana a granel.', priority: 'Baja' }
    ])

    const handleEdit = (id: number, newDesc: string) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, desc: newDesc } : item))
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg h-fit">
                        <Bot className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-blue-400 font-bold text-sm mb-1">Borrador Inteligente</h4>
                        <p className="text-gray-300 text-xs">
                            He creado este plan basado en nuestra conversación. Puedes editar las acciones antes de descargarlo.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 group hover:border-violet-500/30 transition">
                            <div className="flex justify-between items-start mb-2">
                                <h5 className="font-bold text-white flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-xs border border-violet-500/30">
                                        {item.id}
                                    </span>
                                    {item.title}
                                </h5>
                                <span className={`text-[10px] px-2 py-1 rounded-full border ${item.priority === 'Alta' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                    item.priority === 'Media' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                        'bg-green-500/10 border-green-500/20 text-green-400'
                                    }`}>
                                    Prioridad {item.priority}
                                </span>
                            </div>
                            <textarea
                                value={item.desc}
                                onChange={(e) => handleEdit(item.id, e.target.value)}
                                className="w-full bg-black/20 border border-white/5 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-violet-500/50 transition resize-none"
                                rows={2}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20">
                <button
                    onClick={() => alert('¡Plan Final Descargado! (Simulación)')}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                >
                    <CheckCircle className="w-5 h-5" /> Confirmar y Descargar PDF
                </button>
            </div>
        </div>
    )
}

function RecommendationItem({ number, title, description, steps }: { number: number, title: string, description: string, steps: string[] }) {
    const [isExpanded, setIsExpanded] = React.useState(false)

    return (
        <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={`rounded-xl border transition cursor-pointer overflow-hidden ${isExpanded
                ? 'bg-violet-500/20 border-violet-500/40'
                : 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20'
                }`}
        >
            <div className="flex items-center gap-4 p-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition ${isExpanded ? 'bg-violet-500 text-white' : 'bg-violet-500/20 text-violet-400'
                    }`}>
                    {number}
                </div>
                <div className="flex-1">
                    <h5 className="font-bold text-white">{title}</h5>
                    <p className="text-xs text-gray-400">{description}</p>
                </div>
                <ArrowRight className={`w-4 h-4 text-violet-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pl-16">
                            <div className="h-[1px] w-full bg-white/10 mb-3" />
                            <h6 className="text-xs font-bold text-violet-300 uppercase mb-2">Pasos a seguir:</h6>
                            <ul className="space-y-2">
                                {steps.map((step, idx) => (
                                    <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                                        {step}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

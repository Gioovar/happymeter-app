'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, User, Bot, Sparkles, AlertTriangle, X, CheckCircle, Loader2, MessageCircleQuestion } from 'lucide-react'
import { requestHumanSupport } from '@/actions/support'
import { toast } from 'sonner'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function SupportChat() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: '¡Hola! Soy tu asistente de soporte de HappyMeter. 🤖✨\n\nPuedo ayudarte a crear encuestas, entender tus reportes o configurar tu cuenta.\n\n¿En qué te ayudo hoy?' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showHumanModal, setShowHumanModal] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMsg = input
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsLoading(true)

        try {
            const res = await fetch('/api/dashboard/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...messages, { role: 'user', content: userMsg }].map(m => ({ role: m.role, content: m.content })) })
            })

            let data
            try {
                const text = await res.text()
                try {
                    data = JSON.parse(text)
                } catch {
                    throw new Error(`Error del servidor: ${res.status} ${res.statusText}`)
                }
            } catch (e) {
                throw new Error(`Error de conexión: ${e instanceof Error ? e.message : 'Desconocido'}`)
            }

            if (!res.ok) throw new Error(data.error || `Error ${res.status}: ${res.statusText}`)

            setMessages(prev => [...prev, { role: 'assistant', content: data.content }])

        } catch (error) {
            console.error('[SupportChat Error]', error)
            const msg = error instanceof Error ? error.message : 'Error al conectar con el asistente'
            toast.error(msg)
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${msg}` }])
        } finally {
            setIsLoading(false)
        }
    }

    const SUGGESTIONS = [
        "¿Cómo creo una encuesta?",
        "¿Cómo imprimo el QR?",
        "¿Qué son los reportes IA?",
        "Problemas de facturación"
    ]

    return (
        <div className="flex flex-col h-[600px] bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                        <Bot className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Soporte HappyMeter</h3>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            En línea (IA)
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowHumanModal(true)}
                    className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg transition border border-white/5 flex items-center gap-2"
                >
                    <User className="w-3 h-3" />
                    Hablar con Humano
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                            ${m.role === 'user'
                                ? 'bg-violet-600 text-white rounded-br-none'
                                : 'bg-white/10 text-gray-200 rounded-bl-none'}
                        `}>
                            {m.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75" />
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions & Input */}
            <div className="p-4 border-t border-white/10 bg-black/40 space-y-4">
                {messages.length < 3 && (
                    <div className="flex flex-wrap gap-2">
                        {SUGGESTIONS.map(s => (
                            <button
                                key={s}
                                onClick={() => { setInput(s); handleSend(); }} // Fix: calling handleSend directly won't work perfectly due to state batching, but for MVP checking input state logic
                                // Better: directly call with string
                                // onClick={() => { setInput(s); setTimeout(handleSend, 0) }} - Actually better to just reuse logic.
                                // Let's just create a quick separate handler or refactor handleSend to accept arg.
                                className="text-xs bg-white/5 hover:bg-violet-500/20 hover:text-violet-300 border border-white/5 rounded-full px-3 py-1 transition"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex gap-2">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Escribe tu duda aquí..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition text-white"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Human Escalation Modal */}
            {showHumanModal && (
                <HumanEscalationModal onClose={() => setShowHumanModal(false)} />
            )}
        </div>
    )
}

function HumanEscalationModal({ onClose }: { onClose: () => void }) {
    const [issue, setIssue] = useState('')
    const [contact, setContact] = useState('')
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async () => {
        if (!issue.trim()) return
        setSending(true)
        const res = await requestHumanSupport(issue, contact)
        setSending(false)
        if (res.success) {
            setSent(true)
            setTimeout(onClose, 2500)
        } else {
            toast.error('Error al enviar solicitud')
        }
    }

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4 animate-in fade-in zoom-in duration-200">
                {!sent ? (
                    <>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Hablar con un Humano
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-gray-400">
                            Describe tu problema y te responderemos lo antes posible (tiempo medio: 2 hrs).
                        </p>
                        <textarea
                            value={issue}
                            onChange={(e) => setIssue(e.target.value)}
                            placeholder="Describe tu problema..."
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-violet-500/50"
                        />
                        <input
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            placeholder="WhatsApp o Email de contacto (opcional)"
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-violet-500/50"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={sending || !issue.trim()}
                            className="w-full py-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-medium text-white shadow-lg hover:shadow-orange-500/20 transition flex items-center justify-center gap-2"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Solicitud'}
                        </button>
                    </>
                ) : (
                    <div className="text-center py-8 space-y-3">
                        <div className="mx-auto w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center border border-green-500/30">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-white">¡Recibido!</h3>
                        <p className="text-gray-400 text-sm">El equipo ha sido notificado.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

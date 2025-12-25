
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, Zap, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function SellerCoachPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const DEFAULT_MSG: Message = {
        role: 'assistant',
        content: '¡Hola! Soy **HappyCoach** 🚀.\n\nEstoy aquí para ayudarte a cerrar más ventas y dominar tu territorio. ¿Tienes dudas sobre cómo vender a un restaurante o necesitas un guion de ventas?'
    }

    useEffect(() => {
        setMessages([DEFAULT_MSG])
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMessage = input.trim()
        setInput('')

        const newMessages = [...messages, { role: 'user', content: userMessage }] as Message[]
        setMessages(newMessages)
        setIsLoading(true)

        try {
            const response = await fetch('/api/sellers/ai-coach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages
                })
            })

            if (!response.ok) throw new Error('Error de conexión')

            const data = await response.json()
            setMessages(prev => [...prev, { role: 'assistant', content: data.content }])

        } catch (error) {
            console.error(error)
            toast.error('No pude contactar a la central. Intenta de nuevo.')
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Tuve un problema de conexión. ¿Me lo repites?'
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const suggestions = [
        "¿Qué le digo a un dueño de restaurante?",
        "Explícame los precios",
        "¿Cómo funciona la Auto-Recuperación?",
        "Dame un tip para vender hoy"
    ]

    return (
        <div className="flex h-full flex-col bg-[#0f1115] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <header className="px-6 py-4 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-xl z-10 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bot className="w-8 h-8 text-blue-500" />
                        HappyCoach
                    </h1>
                    <p className="text-gray-400 text-sm">Tu entrenador personal de ventas 24/7</p>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden relative z-10 w-full">
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-24">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <AnimatePresence initial={false}>
                            {messages.map((message, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-4",
                                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/10",
                                        message.role === 'user'
                                            ? "bg-gradient-to-br from-blue-600 to-cyan-600"
                                            : "bg-[#1a1d26] bg-opacity-80 backdrop-blur-md"
                                    )}>
                                        {message.role === 'user'
                                            ? <User className="w-4 h-4 text-white" />
                                            : <Bot className="w-4 h-4 text-blue-400" />
                                        }
                                    </div>

                                    <div className={cn(
                                        "px-5 py-3.5 rounded-[20px] max-w-[85%] shadow-md backdrop-blur-sm border",
                                        message.role === 'user'
                                            ? "bg-blue-600/20 text-white border-blue-500/20 rounded-tr-sm"
                                            : "bg-white/5 text-gray-200 border-white/10 rounded-tl-sm"
                                    )}>
                                        <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                            {message.content.split('**').map((part, i) =>
                                                i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-4"
                            >
                                <div className="w-9 h-9 rounded-full bg-[#1a1d26] border border-white/10 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-lg border border-white/5">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <footer className="shrink-0 p-4 md:p-6 bg-[#0f1115]/90 backdrop-blur-xl border-t border-white/5 z-20">
                <div className="max-w-3xl mx-auto w-full">
                    {messages.length === 1 && (
                        <div className="mb-4 hidden md:flex flex-wrap justify-center gap-2">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(s)}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white transition"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="relative group bg-[#15171e] border border-white/10 rounded-full p-2 pl-6 focus-within:border-blue-500/50 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-gray-600 group-focus-within:text-yellow-500 transition-colors" />
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Pregunta algo sobre ventas..."
                                className="flex-1 bg-transparent border-none outline-none text-white h-10 text-sm"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="p-3 bg-blue-600 rounded-full text-white hover:bg-blue-500 disabled:opacity-50 transition"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </div>
                    </form>
                </div>
            </footer>
        </div>
    )
}

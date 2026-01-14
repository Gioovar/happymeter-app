'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Bot, Sparkles, User, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function LandingAIChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [hasInitialized, setHasInitialized] = useState(false)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Lock body scroll when chat is open to prevent background scrolling
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const handleOpen = () => {
        setIsOpen(true)
        if (!hasInitialized && messages.length === 0) {
            setHasInitialized(true)
            // Initial greeting trigger
            sendMessage(true)
        }
    }

    const sendMessage = async (isInitial = false) => {
        if (!input.trim() && !isInitial) return

        const newMessages = isInitial ? [] : [...messages, { role: 'user' as const, content: input }]
        setMessages(newMessages)
        setIsLoading(true)
        setInput('')

        try {
            const res = await fetch('/api/ai/landing-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    businessType: '' // Can be extracted if needed later
                })
            })

            if (!res.ok) throw new Error('Failed to fetch')

            const data = await res.json()
            setMessages(prev => [...prev, data])
        } catch (error) {
            console.error(error)
            // Optional: Show error in chat
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Trigger Button */}
            {/* Trigger Button with Modern Glow Effect */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
                <button
                    onClick={handleOpen}
                    className="relative px-8 py-4 bg-black rounded-full leading-none flex items-center divide-x divide-gray-600"
                >
                    <span className="flex items-center space-x-3 pr-4">
                        <img
                            src="/assets/branding/smile-icon.png"
                            alt="AI"
                            className="w-6 h-6 object-contain animate-pulse brightness-0 invert"
                        />
                        <span className="text-gray-100 font-bold text-lg group-hover:text-white transition-colors">
                            Probar Demo IA
                        </span>
                    </span>
                    <span className="pl-4 text-violet-400 group-hover:text-violet-300 transition duration-200 flex items-center gap-2 font-medium text-sm tracking-widest uppercase">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Online
                    </span>
                </button>
            </div>

            {/* Chat Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[9999] w-full h-[100dvh] md:w-[400px] md:h-[600px] md:max-h-[80vh] md:inset-auto md:bottom-8 md:right-8 bg-[#0a0a0a] border border-white/10 md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between shrink-0 relative z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center relative">
                                    <img src="/assets/branding/logo-primary.png" alt="HappyMeter AI" className="w-6 h-6 object-contain brightness-0 invert" />
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0a] rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">HappyMeter AI</h3>
                                    <p className="text-xs text-violet-300">Asistente Virtual</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-300 hover:text-white transition"
                            >
                                <span>Cerrar Chat</span>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/50 overscroll-contain relative z-10">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed text-left ${msg.role === 'user'
                                        ? 'bg-violet-600 text-white rounded-tr-none'
                                        : 'bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-tl-none'
                                        }`}
                                    >
                                        {msg.content.split('\n').map((line, i) => (
                                            <p key={i} className={`min-h-[1em] ${i > 0 ? 'mt-2' : ''}`}>
                                                {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                        return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>
                                                    }
                                                    return part
                                                })}
                                            </p>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-[#0a0a0a] shrink-0 pb-safe">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    sendMessage()
                                }}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Escribe tu tipo de negocio..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base md:text-sm text-white focus:outline-none focus:border-violet-500 focus:bg-white/10 transition"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !input.trim()}
                                    className="p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

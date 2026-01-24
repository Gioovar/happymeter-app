'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MessageSquare, Send, X, Bot, Sparkles, User, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Lock body scroll ONLY when chat is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        }

        // Cleanup function only restores if it was locked by this component
        return () => {
            if (isOpen) {
                document.body.style.overflow = 'unset'
            }
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

    if (!mounted) return null

    return (
        <>
            {/* Trigger Button */}
            {/* Trigger Button with Modern Glow Effect */}
            <div className="relative group z-30">
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

            {/* Chat Modal Portal */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-end md:items-end md:justify-end md:p-8 pointer-events-none"
                        >
                            {/* Backdrop for mobile */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto md:bg-transparent md:backdrop-blur-none"
                            />

                            <motion.div
                                initial={{ y: '100%', scale: 0.95, opacity: 0 }}
                                animate={{ y: 0, scale: 1, opacity: 1 }}
                                exit={{ y: '100%', scale: 0.95, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="pointer-events-auto w-full h-[100dvh] md:h-[650px] md:w-[400px] md:max-h-[85vh] bg-[#0a0a0a] border border-white/10 md:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
                            >
                                {/* Header */}
                                <div className="p-4 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between shrink-0 relative z-20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center relative shadow-lg shadow-violet-500/20">
                                            <img src="/assets/branding/logo-primary.png" alt="HappyMeter AI" className="w-6 h-6 object-contain brightness-0 invert" />
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0a0a] rounded-full"></span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white tracking-tight">HappyMeter AI</h3>
                                            <p className="text-xs text-violet-300 font-medium">Asistente Virtual</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-full text-xs font-medium text-gray-300 hover:text-white transition-all transform hover:scale-105"
                                    >
                                        <span>Cerrar</span>
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/50 overscroll-contain relative z-10 scroll-smooth">
                                    {messages.length === 0 && !isLoading && (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-50">
                                            <Sparkles className="w-12 h-12 text-violet-500 mb-4 opacity-50" />
                                            <p className="text-sm text-gray-400">Pregúntame cómo HappyMeter puede ayudarte a crecer.</p>
                                        </div>
                                    )}

                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={cn(
                                                "max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed text-left shadow-sm",
                                                msg.role === 'user'
                                                    ? 'bg-violet-600 text-white rounded-tr-sm ml-8'
                                                    : 'bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-tl-sm mr-8'
                                            )}>
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
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex justify-start"
                                        >
                                            <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center shadow-sm">
                                                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"></div>
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-white/10 bg-[#0a0a0a] shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault()
                                            sendMessage()
                                        }}
                                        className="flex gap-2 items-end"
                                    >
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Escribe tu mensaje..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-4 py-3.5 text-base md:text-sm text-white focus:outline-none focus:border-violet-500 focus:bg-white/10 transition shadow-inner placeholder:text-gray-500"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading || !input.trim()}
                                            className="p-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-violet-600/20 active:scale-95 flex items-center justify-center shrink-0"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}



'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, Zap, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import ChatSidebar from '@/components/chat/ChatSidebar'
import { toast } from 'sonner'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function DashboardChatPage() {
    const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(undefined)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showSidebar, setShowSidebar] = useState(false)
    const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const isCreatingThread = useRef(false)

    const DEFAULT_MSG: Message = {
        role: 'assistant',
        content: '¡Hola! Soy tu **HappyMeter Analyst**. 🧠\n\nEstoy conectado a las métricas de tu negocio en tiempo real. Puedo ayudarte a:\n\n• Analizar tendencias de satisfacción.\n• Identificar problemas recurrentes.\n• Redactar manuales de acción paso a paso.\n\n¿Por dónde empezamos hoy?'
    }

    // Load messages when thread changes
    useEffect(() => {
        // Skip fetch if we just created this thread locally (to preserve optimistic state)
        if (isCreatingThread.current) {
            isCreatingThread.current = false
            return
        }

        if (!selectedThreadId) {
            setMessages([DEFAULT_MSG])
            return
        }

        const fetchMessages = async () => {
            setIsLoading(true)
            const toastId = toast.loading("Cargando conversación...")
            try {
                const res = await fetch(`/api/dashboard/chat/threads/${selectedThreadId}`)
                if (res.ok) {
                    const data = await res.json()
                    setMessages(data.messages.length > 0 ? data.messages : [DEFAULT_MSG])
                    toast.dismiss(toastId)
                } else {
                    // Try to parse error
                    const errData = await res.json().catch(() => null)
                    const errMsg = errData?.error || "Error desconocido"

                    // If 404/Deleted, reset
                    setMessages([DEFAULT_MSG])
                    setSelectedThreadId(undefined)
                    toast.error(`Error: ${errMsg}`, { id: toastId })
                }
            } catch (error) {
                console.error('Failed to load thread', error)
                toast.error("Error de conexión", { id: toastId })
            } finally {
                setIsLoading(false)
            }
        }

        fetchMessages()
    }, [selectedThreadId])

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

        // Optimistic UI Update
        const newMessages = [...messages, { role: 'user', content: userMessage }] as Message[]
        setMessages(newMessages)
        setIsLoading(true)

        let activeThreadId = selectedThreadId
        let isNewThread = false

        try {
            // 1. Auto-create thread if doesn't exist
            if (!activeThreadId) {
                const threadRes = await fetch('/api/dashboard/chat/threads', { method: 'POST' })
                if (!threadRes.ok) throw new Error("Could not create thread")

                const thread = await threadRes.json()
                activeThreadId = thread.id

                // IMPORTANT: Flag that we are creating, so useEffect doesn't wipe our optimistic messages
                isCreatingThread.current = true
                setSelectedThreadId(thread.id)
                isNewThread = true
                console.log("Auto-created thread:", thread.id)
            }

            // 2. Perform Chat
            const response = await fetch('/api/dashboard/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: activeThreadId,
                    messages: newMessages.map(m => ({ role: m.role, content: m.content }))
                })
            })

            const data = await response.json()
            if (data.error) throw new Error(data.error)

            setMessages(prev => [...prev, { role: 'assistant', content: data.content }])

            // 3. Update title if backend renamed it (AI Intelligent Renaming)
            if (data.newTitle) {
                // Determine if we need to let sidebar know
                // We can't easily update the sidebar list directly without a refetch,
                // so we trigger the refresh
                setSidebarRefreshTrigger(prev => prev + 1)
                console.log("Auto-renamed thread to:", data.newTitle)
            }

        } catch (error) {
            console.error(error)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ **Error:** No pude conectar con el servidor. Intenta de nuevo.`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    // Quick Suggestions
    const suggestions = [
        "¿Cómo mejoro mi NPS?",
        "Analiza las quejas de limpieza",
        "Dame un plan para meseros",
        "Resumen de esta semana"
    ]

    return (
        <div className="fixed inset-0 md:left-64 z-40 bg-[#0f1115] flex h-[100dvh]">

            {/* Sidebar */}
            <div className={cn(
                "fixed inset-y-0 left-0 w-80 bg-[#0a0a0a] z-50 transform transition-transform duration-300 md:relative md:translate-x-0 md:block border-r border-white/10",
                showSidebar ? "translate-x-0" : "-translate-x-full"
            )}>
                <ChatSidebar
                    currentThreadId={selectedThreadId}
                    onSelectThread={(id) => {
                        setSelectedThreadId(id)
                        setShowSidebar(false)
                    }}
                    refreshTrigger={sidebarRefreshTrigger}
                />
            </div>

            {/* Overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative min-w-0 bg-[#0f1115]">

                {/* 1. LAYER - Ambient Background */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-600/5 rounded-full blur-[100px]" />
                </div>

                {/* 2. LAYER - Header */}
                <header className="shrink-0 h-16 px-4 md:px-6 border-b border-white/5 bg-[#0f1115]/80 backdrop-blur-xl flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 text-gray-400 hover:text-white">
                            <Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                                <div className="p-1.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-lg">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 truncate">
                                    Centro de Inteligencia
                                </span>
                            </h1>
                        </div>
                    </div>
                </header>

                {/* 3. LAYER - Messages */}
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
                                            "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/10",
                                            message.role === 'user'
                                                ? "bg-gradient-to-br from-violet-600 to-fuchsia-600"
                                                : "bg-[#1a1d26] bg-opacity-80 backdrop-blur-md"
                                        )}>
                                            {message.role === 'user'
                                                ? <User className="w-4 h-4 text-white" />
                                                : <Sparkles className="w-4 h-4 text-violet-400" />
                                            }
                                        </div>

                                        <div className={cn(
                                            "px-4 md:px-5 py-3 md:py-3.5 rounded-[20px] max-w-[85%] md:max-w-[80%] shadow-md backdrop-blur-sm border",
                                            message.role === 'user'
                                                ? "bg-violet-600/20 text-white border-violet-500/20 rounded-tr-sm"
                                                : "bg-white/5 text-gray-200 border-white/10 rounded-tl-sm"
                                        )}>
                                            <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-[14px]">
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
                                        <Sparkles className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5 shadow-lg border border-white/5">
                                        <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    </div>
                </div>

                {/* 4. LAYER - Input */}
                <footer className="shrink-0 p-4 md:p-6 bg-[#0f1115]/90 backdrop-blur-xl border-t border-white/5 z-20">
                    <div className="max-w-3xl mx-auto w-full">
                        {messages.length === 1 && selectedThreadId === undefined && (
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

                        <form onSubmit={handleSubmit} className="relative group bg-[#15171e] border border-white/10 rounded-full p-2 pl-6 focus-within:border-violet-500/50 shadow-2xl">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-gray-600 group-focus-within:text-fuchsia-500 transition-colors" />
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Escribe tu mensaje..."
                                    className="flex-1 bg-transparent border-none outline-none text-white h-10 text-sm"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isLoading}
                                    className="p-3 bg-violet-600 rounded-full text-white hover:bg-violet-500 disabled:opacity-50 transition"
                                >
                                    <Send className="w-4 h-4 ml-0.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </footer>

            </div>
        </div>
    )
}


'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, Bot, User, ArrowLeft, Menu, Plus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

export default function FullScreenChat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isTyping])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsTyping(true)

        try {
            const res = await fetch('/api/creators/chat', {
                method: 'POST',
                body: JSON.stringify({ messages: [...messages, userMsg] })
            })
            const data = await res.json()

            if (data.error) throw new Error(data.error)

            if (!res.ok) {
                if (res.status === 429) throw new Error('Límite diario de IA alcanzado (20/20). Intenta mañana.')
                throw new Error(`Error ${res.status}: ${res.statusText}`)
            }

            setMessages(prev => [...prev, data])
        } catch (error) {
            console.error(error)
            const msg = error instanceof Error ? error.message : 'Error al conectar con el Coach'

            if (!msg.includes('Límite diario')) toast.error(msg)

            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${msg}` }])
        } finally {
            setIsTyping(false)
        }
    }

    const suggestions = [
        "Dame 3 ganchos virales para TikTok",
        "¿Cómo explico los beneficios de HappyMeter?",
        "Escribe un guion de ventas corto",
        "Ideas para posts en Instagram"
    ]

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex w-[280px] flex-col border-r border-white/10 bg-[#111] p-4">
                <div className="mb-6 flex items-center gap-2 px-2">
                    <Link href="/creators/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <span className="font-bold text-lg tracking-tight">HappyMeter<span className="text-violet-500">AI</span></span>
                </div>

                <button
                    onClick={() => setMessages([])}
                    className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] text-gray-300 px-4 py-3 rounded-full border border-white/5 transition mb-6 text-sm font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Chat
                </button>

                <div className="flex-1 overflow-y-auto">
                    <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Historial Reciente</p>
                    <div className="space-y-1">
                        <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-400 truncate transition">
                            Ideas para TikTok...
                        </button>
                        <button className="w-full text-left px-4 py-2 rounded-lg hover:bg-white/5 text-sm text-gray-400 truncate transition">
                            Beneficios de la plataforma...
                        </button>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 cursor-pointer transition">
                        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                            YO
                        </div>
                        <div className="text-sm">
                            <p className="font-medium">Creador</p>
                            <p className="text-xs text-gray-500">Plan Pro</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col relative">
                {/* Mobile Header */}
                <header className="md:hidden h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#111]">
                    <Link href="/creators/dashboard">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <span className="font-bold">HappyMeter Coach</span>
                    <Menu className="w-5 h-5 text-gray-400" />
                </header>

                {/* Chat Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-0">
                    <div className="max-w-3xl mx-auto w-full h-full flex flex-col">

                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 p-8 min-h-[60vh]">
                                <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-violet-500/20 mb-4">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-white">
                                    ¿En qué puedo ayudarte hoy?
                                </h1>
                                <p className="text-xl text-gray-400 max-w-lg">
                                    Soy tu experto en contenido. Pídeme guiones, estrategias o ideas para viralizar HappyMeter.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                setInput(s)
                                                // Optional: auto-submit
                                            }}
                                            className="p-4 bg-[#1a1a1a] hover:bg-[#222] border border-white/5 rounded-2xl text-left text-gray-300 hover:text-violet-300 transition text-sm"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 py-8 space-y-8 pb-32">
                                {messages.map((m, i) => (
                                    <div key={i} className={`flex gap-4 md:gap-6 ${m.role === 'user' ? 'justify-end' : 'justify-start'} px-4`}>
                                        {m.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex-shrink-0 flex items-center justify-center mt-1">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        <div className={`max-w-[85%] md:max-w-[75%] space-y-2`}>
                                            <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-white/10">
                                                <p className="whitespace-pre-wrap text-[15px] md:text-base leading-7 text-gray-200">
                                                    {m.content}
                                                </p>
                                            </div>
                                        </div>

                                        {m.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-[#222] border border-white/10 flex-shrink-0 flex items-center justify-center mt-1 text-gray-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex gap-4 px-4">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex-shrink-0 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                                        </div>
                                        <div className="flex items-center gap-1 h-8">
                                            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100" />
                                            <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200" />
                                        </div>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-10 pb-6 px-4">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSubmit} className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
                            <div className="relative bg-[#1a1a1a] border border-white/10 rounded-3xl flex items-center p-2 shadow-2xl">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Pregúntale al Coach..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 px-4 py-3 text-base"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="p-3 bg-white text-black rounded-2xl hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-white transition"
                                >
                                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-center text-xs text-gray-600 mt-3">
                                HappyMeter Coach puede cometer errores. Verifica la información importante.
                            </p>
                        </form>
                    </div>
                </div>

            </main>
        </div>
    )
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}

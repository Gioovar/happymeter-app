
'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles, Bot } from 'lucide-react'

type Message = {
    role: 'user' | 'assistant'
    content: string
}

export default function CreatorChat({ userId }: { userId?: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)

    // Attachment State
    const [attachment, setAttachment] = useState<{ url: string, type: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const scrollRef = useRef<HTMLDivElement>(null)

    // Poll for messages every 5s when open
    useEffect(() => {
        if (!isOpen) return

        // Initial fetch
        fetchMessages()

        const interval = setInterval(fetchMessages, 5000)
        return () => clearInterval(interval)
    }, [isOpen])

    const fetchMessages = async () => {
        try {
            const { getMyChat } = await import('@/actions/chat')
            const chat = await getMyChat()
            if (chat) {
                // Formatting for UI
                const uiMessages = chat.messages.map((m: any) => ({
                    role: m.senderId === userId ? 'user' : 'assistant',
                    content: m.content,
                    attachmentUrl: m.attachmentUrl,
                    attachmentType: m.attachmentType
                }))

                setMessages(prev => {
                    if (prev.length !== uiMessages.length) {
                        return uiMessages
                    }
                    return prev
                })
            }
        } catch (error) {
            console.error(error)
        }
    }

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen, attachment])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) { // 5MB limit check
            // We could use toast from sonner here if available, or simple alert for floating chat
            alert('El archivo es demasiado grande (Máx 5MB)')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const type = file.type.startsWith('image/') ? 'image' : 'document'
            setAttachment({ url: reader.result as string, type })
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!input.trim() && !attachment) || !userId) return

        const userMsg = {
            role: 'user',
            content: input,
            attachmentUrl: attachment?.url,
            attachmentType: attachment?.type
        }

        const currentAttachment = attachment

        setMessages(prev => [...prev, userMsg]) // Optimistic
        setInput('')
        setAttachment(null)
        setIsTyping(true)

        try {
            const { sendMessage } = await import('@/actions/chat')
            await sendMessage(userId, userMsg.content, userId, currentAttachment || undefined)
            await fetchMessages() // Refresh to be sure
        } catch (error) {
            console.error(error)
        } finally {
            setIsTyping(false)
        }
    }

    if (!userId) return null // Hide if no user context

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[calc(100vw-3rem)] sm:w-[350px] h-[550px] max-h-[80vh] bg-[#111] border border-violet-500/30 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200 ring-4 ring-black/40 relative">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-between shadow-lg z-10 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base">Soporte Renovado</h3>
                                <p className="text-[10px] text-violet-100/80 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                    Respuesta inmediata
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition text-white/90">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Container with Gradient */}
                    <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-6 bg-gradient-to-b from-[#2e1a5e] via-[#0a0a0a] to-[#0a0a0a]">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center p-6 text-center opacity-40">
                                <Sparkles className="w-12 h-12 text-violet-400 mb-4" />
                                <p className="text-violet-200 text-sm">
                                    ¡Hola! 👋<br />
                                    Estamos aquí para ayudarte.
                                </p>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`w-full flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-5 py-3.5 text-sm shadow-md transition-all hover:scale-[1.02] ${m.role === 'user'
                                    ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-[24px] rounded-br-none ml-auto'
                                    : 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-[24px] rounded-bl-none shadow-lg mr-auto'
                                    }`}>
                                    {/* Link/Name for Staff messages */}
                                    {m.role !== 'user' && (
                                        <div className="flex items-center gap-2 mb-1 opacity-80 decoration-slice">
                                            <span className="text-[9px] font-bold text-blue-100 uppercase tracking-wider">Soporte</span>
                                        </div>
                                    )}

                                    {m.attachmentUrl && (
                                        <div className="mb-2">
                                            {m.attachmentType === 'image' ? (
                                                <img src={m.attachmentUrl} alt="Adjunto" className="max-w-full rounded-xl" />
                                            ) : (
                                                <a href={m.attachmentUrl} download className="flex items-center gap-2 bg-black/5 p-2 rounded-xl hover:bg-black/10 transition text-xs font-medium">
                                                    <span className="text-lg">📎</span>
                                                    <span>Descargar Archivo</span>
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <p className="leading-relaxed">{m.content}</p>
                                    <span className={`text-[9px] block text-right mt-1 opacity-60 ${m.role === 'user' ? 'text-violet-100' : 'text-blue-100'}`}>
                                        Justo ahora
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Attachment Preview */}
                    {attachment && (
                        <div className="px-4 py-2 bg-[#1a1a1a] border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden bg-[#2a2a2a] pl-1 pr-3 py-1 rounded-full">
                                {attachment.type === 'image' ? (
                                    <img src={attachment.url} className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500" />
                                ) : (
                                    <span className="text-xl pl-2">📎</span>
                                )}
                                <span className="text-xs text-violet-200 truncate">Listo para enviar</span>
                            </div>
                            <button onClick={() => setAttachment(null)} className="p-1.5 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500 hover:text-white transition">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-3 bg-[#0a0a0a] border-t border-white/5">
                        <div className="relative flex items-center gap-2 bg-[#1a1a1a] p-1.5 rounded-full border border-white/10 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/50 transition-all shadow-inner">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={handleFileSelect}
                            />

                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-transparent text-white text-sm px-2 focus:outline-none placeholder:text-gray-500"
                            />

                            <button
                                type="submit"
                                disabled={(!input.trim() && !attachment)}
                                className="p-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-violet-600/20 disabled:opacity-50 disabled:shadow-none transition transform hover:scale-105 active:scale-95"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-violet-500/20 transition-all duration-300 ${isOpen ? 'bg-[#222] text-white rotate-90' : 'bg-violet-600 text-white hover:scale-110'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
                )}
            </button>
        </div>
    )
}

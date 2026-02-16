'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User as UserIcon, ShieldCheck, ChevronLeft } from 'lucide-react'
import { getInternalMessages, sendInternalMessage, markMessagesAsRead } from '@/actions/internal-communications'
import { cn } from '@/lib/utils'

interface Message {
    id: string
    content: string
    senderId: string
    receiverId: string
    createdAt: Date
}

export default function ChatView({
    memberId,
    branchId,
    ownerId,
    ownerName
}: {
    memberId: string,
    branchId: string,
    ownerId: string,
    ownerName: string
}) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newText, setNewText] = useState('')
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchMessages = async () => {
        if (!memberId || !ownerId || !branchId) return
        try {
            const data = await getInternalMessages(branchId, ownerId, memberId)
            setMessages(data)
            // Mark as read when viewing
            await markMessagesAsRead(branchId, ownerId, memberId)
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 10000) // Poll every 10s
        return () => clearInterval(interval)
    }, [memberId, ownerId, branchId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newText.trim() || isSending) return

        setIsSending(true)
        try {
            const formData = new FormData()
            formData.append('content', newText)
            formData.append('senderId', memberId)
            formData.append('receiverId', ownerId)
            formData.append('branchId', branchId)

            await sendInternalMessage(formData)
            setNewText('')
            await fetchMessages()
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-[#0a0a0a]">
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-[#0f1115]/50 backdrop-blur-xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                    <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-white tracking-tight">{ownerName}</h2>
                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest leading-none mt-1">Soporte Operativo</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-10">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                            <Send className="w-8 h-8 text-gray-700 -rotate-12" />
                        </div>
                        <h3 className="text-white font-bold mb-2">Canal Directo</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Envía un mensaje a tu supervisor o administrador. Recibirás una respuesta por este mismo canal.
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMine = msg.senderId === memberId
                        return (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex flex-col max-w-[80%]",
                                    isMine ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "p-4 rounded-3xl text-sm leading-relaxed shadow-lg",
                                        isMine
                                            ? "bg-violet-600 text-white rounded-tr-none"
                                            : "bg-[#1a1c22] text-gray-200 border border-white/5 rounded-tl-none"
                                    )}
                                >
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-1.5 ml-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-[#0f1115]/50 backdrop-blur-xl border-t border-white/5">
                <form onSubmit={handleSend} className="flex gap-3">
                    <input
                        type="text"
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-violet-500/50 transition-colors placeholder:text-gray-600"
                    />
                    <button
                        type="submit"
                        disabled={!newText.trim() || isSending}
                        className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                        <Send className="w-6 h-6 text-white" />
                    </button>
                </form>
            </div>
        </div>
    )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User, Shield } from 'lucide-react'
import { sendMessage } from '@/actions/chat'
import { cn } from '@/lib/utils'

interface Message {
    id: string
    senderId: string
    content: string
    createdAt: Date
}

interface AdminChatWindowProps {
    creatorId: string
    currentUserId: string
    initialMessages: Message[]
}

export default function AdminChatWindow({ creatorId, currentUserId, initialMessages }: AdminChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return

        setIsSending(true)
        // Optimistic update
        const tempId = Math.random().toString()
        const msg: Message = {
            id: tempId,
            senderId: currentUserId,
            content: newMessage,
            createdAt: new Date()
        }

        setMessages(prev => [...prev, msg])
        setNewMessage('')

        try {
            await sendMessage(creatorId, msg.content, currentUserId)
        } catch (error) {
            console.error('Failed to send message', error)
            // Revert or show error (simplified here)
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="bg-[#111] border border-white/10 rounded-xl flex flex-col h-[500px]">
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-500" />
                <h3 className="font-bold text-white">Chat Interno</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-50 space-y-2">
                        <img
                            src="/assets/icons/bot-avatar-purple.png"
                            className="w-10 h-10 grayscale opacity-50"
                            alt="Empty"
                        />
                        <p className="text-sm text-gray-500">Inicia la conversación...</p>
                    </div>
                )}
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId
                    return (
                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                                isMe ? "bg-violet-600 text-white" : "bg-white/10 text-gray-200"
                            )}>
                                <p>{msg.content}</p>
                                <p className="text-[10px] opacity-50 mt-1 text-right">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                />
                <button
                    onClick={handleSend}
                    disabled={isSending || !newMessage.trim()}
                    className="p-2 bg-violet-600 rounded-lg hover:bg-violet-500 disabled:opacity-50 transition"
                >
                    <Send className="w-4 h-4 text-white" />
                </button>
            </div>
        </div>
    )
}

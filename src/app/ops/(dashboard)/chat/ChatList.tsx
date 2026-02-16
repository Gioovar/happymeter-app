'use client'

import { useState } from 'react'
import { Search, ChevronRight, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Conversation {
    otherId: string
    name: string
    avatar: string | null
    lastMessage: string
    lastDate: Date
    unreadCount: number
    jobTitle: string
}

export default function ChatList({
    conversations,
    currentMemberId
}: {
    conversations: Conversation[],
    currentMemberId: string
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] bg-[#0a0a0a]">
            {/* Header */}
            <div className="p-6 bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-black text-white tracking-tighter">Chats</h1>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <MessageCircle className="w-5 h-5 text-gray-400" />
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar chat..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-gray-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredConversations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center mb-6 border border-white/5 opacity-50">
                            <MessageCircle className="w-8 h-8 text-gray-800" />
                        </div>
                        <h3 className="text-white/40 font-bold mb-1">Sin Conversaciones</h3>
                        <p className="text-gray-600 text-xs">Aún no has recibido mensajes del equipo directivo.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredConversations.map((conv) => (
                            <button
                                key={conv.otherId}
                                onClick={() => router.push(`/ops/chat?with=${conv.otherId}`)}
                                className="w-full flex items-center gap-4 p-4 hover:bg-white/[0.02] active:bg-white/[0.05] transition-colors text-left group"
                            >
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-white/5 flex items-center justify-center overflow-hidden">
                                        {conv.avatar ? (
                                            <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-7 h-7 text-violet-500" />
                                        )}
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-violet-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-[#0a0a0a] ring-2 ring-violet-600/40">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-black text-white tracking-tight truncate">{conv.name}</span>
                                        <span className={cn(
                                            "text-[10px] font-bold tracking-tighter transition-colors",
                                            conv.unreadCount > 0 ? "text-violet-500" : "text-gray-600"
                                        )}>
                                            {new Date(conv.lastDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <p className={cn(
                                            "text-xs truncate leading-none",
                                            conv.unreadCount > 0 ? "text-gray-200 font-bold" : "text-gray-500 font-medium"
                                        )}>
                                            {conv.lastMessage}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

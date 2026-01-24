'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User, Bot, Search, MessageSquare, Loader2, RefreshCw, Paperclip, Trash2, Download, Image as ImageIcon, X } from 'lucide-react'
import { getStaffChats, getStaffChatDetails, replyToChat, markChatAsRead, deleteChat } from '@/actions/staff'
import { sendMessage } from '@/actions/chat'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'

type ChatPreview = {
    id: string
    creatorId: string
    updatedAt: Date
    creator: {
        niche: string | null
        audienceSize: string | null
        code: string
        user: {
            businessName: string | null
            id: string
        }
    }
    messages: any[]
    _count: {
        messages: number // Unread count
    }
}

type FullChat = {
    id: string
    messages: any[]
    creatorId: string
}

export default function StaffChatUI({ staffId }: { staffId: string }) {
    const [chats, setChats] = useState<ChatPreview[]>([])
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
    const [messages, setMessages] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [input, setInput] = useState('')

    // Attachment State
    const [attachment, setAttachment] = useState<{ url: string, type: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    // 1. Fetch Chats List
    useEffect(() => {
        loadChats()
        const interval = setInterval(loadChats, 10000) // Poll list every 10s
        return () => clearInterval(interval)
    }, [])

    const [error, setError] = useState<string | null>(null)

    const loadChats = async () => {
        try {
            const data = await getStaffChats()
            setChats(data as any)
            setError(null)
        } catch (error: any) {
            console.error(error)
            setError(error.message || 'Error loading chats')
        } finally {
            setIsLoading(false)
        }
    }

    // 2. Fetch Selected Chat Details
    useEffect(() => {
        if (!selectedChatId) return

        markChatAsRead(selectedChatId) // Mark read on select
        loadMessages(selectedChatId)

        // Optimistically update count in list
        setChats(prev => prev.map(c =>
            c.id === selectedChatId
                ? { ...c, _count: { messages: 0 } }
                : c
        ))

        const interval = setInterval(() => loadMessages(selectedChatId), 3000) // Poll chat fast
        return () => clearInterval(interval)
    }, [selectedChatId])

    const loadMessages = async (id: string) => {
        try {
            const data = await getStaffChatDetails(id)
            if (data) {
                setMessages(data.messages)
            }
        } catch (error) {
            console.error(error)
        }
    }

    // Scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    // --- Actions ---

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) { // 5MB limit check
            toast.error('El archivo es demasiado grande (Máx 5MB)')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const type = file.type.startsWith('image/') ? 'image' : 'document'
            setAttachment({ url: reader.result as string, type })
        }
        reader.readAsDataURL(file)
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if ((!input.trim() && !attachment) || !selectedChatId) return

        setIsSending(true)
        const content = input
        const currentAttachment = attachment

        setInput('')
        setAttachment(null) // Clear attachment

        try {
            await replyToChat(selectedChatId, content, staffId, currentAttachment || undefined)
            await loadMessages(selectedChatId)
            await loadChats()

        } catch (error) {
            toast.error('Error al enviar mensaje')
            setInput(content)
            setAttachment(currentAttachment)
        } finally {
            setIsSending(false)
        }
    }

    const handleCloseChat = async () => {
        if (!selectedChatId) return
        if (!confirm('¿Estás seguro de cerrar y eliminar esta conversación? Esta acción no se puede deshacer.')) return

        try {
            await deleteChat(selectedChatId)
            toast.success('Conversación cerrada y eliminada')
            setSelectedChatId(null)
            setMessages([])
            loadChats()
        } catch (error) {
            toast.error('Error al cerrar la conversación')
        }
    }

    const handleExportPDF = () => {
        if (!messages.length) return

        const doc = new jsPDF()
        let y = 20
        const selectedChat = chats.find(c => c.id === selectedChatId)
        const creatorName = getCreatorName(selectedChat)

        doc.setFontSize(18)
        doc.text(`Historial de Chat: ${creatorName}`, 10, y)
        y += 10
        doc.setFontSize(10)
        doc.text(`Generado: ${new Date().toLocaleString()}`, 10, y)
        y += 20

        messages.forEach(m => {
            const isMe = m.senderId === staffId || m.senderId === 'system' || m.senderId === 'support-bot'
            const senderName = isMe ? 'Staff' : creatorName
            const time = new Date(m.createdAt).toLocaleString()

            // Page break check
            if (y > 270) {
                doc.addPage()
                y = 20
            }

            doc.setFont('helvetica', 'bold')
            doc.text(`${senderName} [${time}]`, 10, y)
            y += 5

            doc.setFont('helvetica', 'normal')
            // Split text to fit width
            const lines = doc.splitTextToSize(m.content || '[Adjunto]', 180)
            doc.text(lines, 10, y)

            y += (lines.length * 5) + 5
        })

        doc.save(`Chat_History_${creatorName}_${Date.now()}.pdf`)
        toast.success('PDF descargado')
    }

    // Helper for display name
    const getCreatorName = (c: any) => {
        if (!c) return 'Creador'
        return c.creator?.user?.businessName || c.creator?.code || 'Creador'
    }

    return (
        <div className="flex h-[calc(100vh-100px)] border border-white/10 rounded-2xl overflow-hidden bg-[#111]">
            {/* Sidebar List */}
            <div className={`w-full md:w-80 border-r border-white/10 flex flex-col bg-[#0a0a0a] ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-violet-500" />
                        Mensajes
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No hay conversaciones activas.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {chats.map(chat => {
                                const unreadCount = chat._count?.messages || 0
                                return (
                                    <button
                                        key={chat.id}
                                        onClick={() => setSelectedChatId(chat.id)}
                                        className={`w-full p-4 text-left hover:bg-white/5 transition flex gap-3 ${selectedChatId === chat.id ? 'bg-violet-900/20 border-l-2 border-violet-500' : ''}`}
                                    >
                                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-gray-400" />
                                            {/* Status Alert */}
                                            {unreadCount > 0 ? (
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center">
                                                    <span className="text-[8px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                                </div>
                                            ) : (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0a]" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h4 className={`font-medium truncate pr-2 text-sm ${unreadCount > 0 ? 'text-white font-bold' : 'text-gray-200'}`}>
                                                    {getCreatorName(chat)}
                                                </h4>
                                                {/* Date Logic */}
                                                {chat.updatedAt && (
                                                    <span className="text-[10px] text-gray-600 shrink-0">
                                                        {new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs truncate ${unreadCount > 0 ? 'text-white' : 'text-gray-500'}`}>
                                                {chat.messages[0]?.content || (chat.messages[0]?.attachmentUrl ? '📎 Adjunto' : 'Sin mensajes')}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-[#111] ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                {selectedChatId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 bg-[#161616] flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <button className="md:hidden text-gray-400" onClick={() => setSelectedChatId(null)}>
                                    <X className="w-5 h-5" />
                                    {/* Using X as back for now, or arrow-left if imported */}
                                </button>
                                <h3 className="font-bold text-white">
                                    {getCreatorName(chats.find(c => c.id === selectedChatId))}
                                </h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportPDF}
                                    className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
                                    title="Descargar PDF"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={handleCloseChat}
                                    className="p-2 hover:bg-red-500/20 rounded-full transition text-gray-400 hover:text-red-500"
                                    title="Cerrar y eliminar conversación"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((m) => {
                                const currentChat = chats.find(c => c.id === selectedChatId)
                                // We check if message is from the Creator (counterparty)
                                // If IDs are identical (staff == creator), we assume Left for Creator messages if we can distinguish via another way...
                                // But since we lack role, we rely on: Is it from Creator? -> Left.
                                // Logic: If senderId == creatorUserId -> Left. Else -> Right.

                                const creatorUserId = currentChat?.creator?.user?.id

                                // Prioritize Creator ID check. If the message sender is the Creator, it's NOT 'Me' (even if IDs match in a dev scenario, this forces the visual separation if the intent was 'reply as creator').
                                // Wait, if I reply as Staff, senderId is also Me.
                                // If IDs are identical, we can't distinguish. 
                                // BUT, robust apps usually don't have this issues. 
                                // Let's use standard logic: Is it ME (Staff)?

                                let isMe = m.senderId === staffId || m.senderId === 'system' || m.senderId === 'support-bot'

                                // Fix for when Staff is chatting with themselves (Staff ID == Creator ID)
                                // We cannot distinguish easily without role. 
                                // But assuming the User wants to see the "reply" on the Right and "received" on Left.

                                // Actually, let's reverse the check: Is it the Creator?
                                if (creatorUserId && m.senderId === creatorUserId && staffId !== creatorUserId) {
                                    isMe = false
                                }
                                // If IDs are equal, we default to 'isMe' = true (Right). This is standard.
                                // The User's bug report suggests Creator messages are appearing on Right.
                                // This implies m.senderId === staffId.
                                // If so, then Creator ID must equal Staff ID.

                                // If the User says "reparado", maybe they mean:
                                // "System/Bot messages should be Left"?
                                // No, usually Bot acts as Support (Right).

                                // Let's try to infer from 'isCreator' logic if possible.
                                // If m.senderId !== staffId -> Left.

                                return (
                                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-md ${isMe
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-[#202c33] text-white rounded-tl-none border border-white/5'
                                            }`}>
                                            {!isMe && (
                                                <span className="block text-[10px] text-blue-300 font-bold mb-1">
                                                    {getCreatorName(chats.find(c => c.id === selectedChatId))}
                                                </span>
                                            )}
                                            {m.attachmentUrl && (
                                                <div className="mb-2">
                                                    {m.attachmentType === 'image' ? (
                                                        <img src={m.attachmentUrl} alt="Adjunto" className="max-w-full rounded-lg border border-white/10" />
                                                    ) : (
                                                        <a href={m.attachmentUrl} download className="flex items-center gap-2 bg-black/20 p-2 rounded hover:bg-black/40 transition">
                                                            <Paperclip className="w-4 h-4" />
                                                            <span>Descargar Archivo</span>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap">{m.content}</p>
                                            <span className="text-[10px] opacity-50 block text-right mt-1">
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}

                        {/* File Preview */}
                        {attachment && (
                            <div className="px-4 pb-2 bg-[#161616] flex items-center">
                                <div className="bg-violet-900/30 border border-violet-500/50 rounded-lg p-2 flex items-center gap-2">
                                    {attachment.type === 'image' ? (
                                        <img src={attachment.url} className="w-8 h-8 rounded object-cover" />
                                    ) : (
                                        <Paperclip className="w-4 h-4 text-violet-300" />
                                    )}
                                    <span className="text-xs text-violet-200">Archivo seleccionado</span>
                                    <button onClick={() => setAttachment(null)} className="ml-2 hover:text-white transition">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSend} className="p-4 bg-[#161616] border-t border-white/10">
                            <div className="flex gap-2 items-end">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-3 bg-[#222] text-gray-400 rounded-xl hover:text-white hover:bg-[#333] transition border border-white/10"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={handleFileSelect}
                                />

                                <div className="flex-1 flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Escribe una respuesta como Staff..."
                                        className="w-full bg-[#0a0a0a] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-violet-500 border border-white/10"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!input.trim() && !attachment) || isSending}
                                    className="px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 disabled:opacity-50 transition flex items-center gap-2"
                                >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <MessageSquare className="w-16 h-16 opacity-20 mb-4" />
                        <p>Selecciona una conversación para ver los mensajes.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Temporary Action Import wrapper if needed, but we used standard import.
// I need updates to staff.ts first to include replyToChat.

'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Search,
    MessageSquare,
    Send,
    Store,
    User as UserIcon,
    ChevronRight,
    Loader2,
    ArrowLeft
} from 'lucide-react'
import { getInternalMessages, sendInternalMessage, markMessagesAsRead } from '@/actions/internal-communications'
import { cn } from '@/lib/utils'

interface StaffMember {
    id: string
    clerkUserId: string
    name: string
    jobTitle: string
    branchId: string
    branchName: string
    stats?: {
        total: number
        done: number
        compliance: number
    }
}

interface BranchGroup {
    branchId: string
    branchName: string
    members: StaffMember[]
}

interface Message {
    id: string
    content: string
    senderId: string
    receiverId: string
    createdAt: Date
}

export default function ManagerMessenger({
    initialStaffList,
    currentUserId
}: {
    initialStaffList: BranchGroup[],
    currentUserId: string
}) {
    const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newText, setNewText] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchMessages = async () => {
        if (!selectedMember || !currentUserId) return
        try {
            const data = await getInternalMessages(
                selectedMember.branchId,
                selectedMember.clerkUserId,
                currentUserId
            )
            setMessages(data)
            // Mark as read
            await markMessagesAsRead(selectedMember.branchId, selectedMember.clerkUserId, currentUserId)
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    // Effect for polling when someone is selected
    useEffect(() => {
        if (!selectedMember) return

        setIsLoadingMessages(true)
        fetchMessages().then(() => setIsLoadingMessages(false))

        const interval = setInterval(fetchMessages, 10000)
        return () => clearInterval(interval)
    }, [selectedMember, currentUserId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newText.trim() || isSending || !selectedMember) return

        setIsSending(true)
        try {
            const formData = new FormData()
            formData.append('content', newText)
            formData.append('receiverId', selectedMember.clerkUserId)
            formData.append('branchId', selectedMember.branchId)

            await sendInternalMessage(formData)
            setNewText('')
            await fetchMessages()
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setIsSending(false)
        }
    }

    const filteredStaff = initialStaffList.map(group => ({
        ...group,
        members: group.members.filter(m =>
            m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.branchName.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(group => group.members.length > 0)

    return (
        <div className="flex h-[calc(100vh-140px)] bg-[#0a0a0a] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            {/* Sidebar: Staff List */}
            <div className={cn(
                "w-full md:w-80 border-r border-white/5 flex flex-col bg-[#0f1115]/50 backdrop-blur-xl",
                selectedMember ? "hidden md:flex" : "flex"
            )}>
                <div className="p-6">
                    <h2 className="text-xl font-black text-white tracking-tight mb-4">Mensajería</h2>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar personal..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                    {filteredStaff.map((group) => (
                        <div key={group.branchId} className="space-y-1">
                            <div className="px-4 py-2 flex items-center gap-2">
                                <Store className="w-3 h-3 text-gray-600" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{group.branchName}</span>
                            </div>
                            {group.members.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => setSelectedMember(member)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-2xl transition-all group",
                                        selectedMember?.id === member.id
                                            ? "bg-emerald-600/10 border border-emerald-500/20 text-white"
                                            : "hover:bg-white/5 text-gray-400 hover:text-white"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        selectedMember?.id === member.id ? "bg-emerald-600 text-white" : "bg-white/5 group-hover:bg-white/10"
                                    )}>
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col items-start overflow-hidden min-w-0">
                                        <span className="text-sm font-bold truncate w-full">{member.name}</span>
                                        <div className="flex flex-col gap-0.5 w-full">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] opacity-60 uppercase font-bold tracking-tighter truncate">{member.jobTitle}</span>
                                                {member.stats && member.stats.total > 0 && (
                                                    <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                                                        <span className="w-1 h-1 rounded-full bg-white/20" />
                                                        <span className={cn(
                                                            "text-[10px] font-black tracking-tighter",
                                                            member.stats.compliance >= 90 ? "text-emerald-400" :
                                                                member.stats.compliance >= 70 ? "text-amber-400" :
                                                                    "text-rose-400"
                                                        )}>
                                                            {member.stats.compliance}% de {member.stats.total} tareas
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {member.stats && member.stats.total > 0 && (
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase tracking-tight",
                                                    member.stats.compliance >= 90 ? "text-emerald-500" :
                                                        member.stats.compliance >= 70 ? "text-amber-500/80" :
                                                            "text-rose-500"
                                                )}>
                                                    {member.stats.compliance >= 90 ? "¡Excelente empleado!" :
                                                        member.stats.compliance >= 80 ? "Cumpliendo bien" :
                                                            member.stats.compliance >= 50 ? "Puede mejorar" :
                                                                "No está cumpliendo"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className={cn(
                                        "ml-auto w-4 h-4 transition-transform hidden lg:block",
                                        selectedMember?.id === member.id ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                                    )} />
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main: Chat View */}
            <div className={cn(
                "flex-1 flex flex-col bg-black/40",
                !selectedMember ? "hidden md:flex items-center justify-center p-12 text-center" : "flex"
            )}>
                {!selectedMember ? (
                    <div className="max-w-md">
                        <div className="w-24 h-24 rounded-[3rem] bg-emerald-600/10 flex items-center justify-center mx-auto mb-8 border border-emerald-500/10">
                            <MessageSquare className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 tracking-tight">Tu Centro de Comunicación</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Selecciona a un colaborador del panel izquierdo para iniciar una conversación directa. Los mensajes son privados y seguros.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 border-b border-white/5 bg-[#0f1115]/50 backdrop-blur-xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedMember(null)}
                                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <UserIcon className="w-6 h-6 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-black text-white tracking-tight truncate">{selectedMember.name}</h2>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mt-1">
                                        {selectedMember.branchName} • {selectedMember.jobTitle}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {isLoadingMessages && messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                                    <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                                        <Send className="w-8 h-8 text-gray-800 -rotate-12" />
                                    </div>
                                    <h3 className="text-white font-bold mb-2">Sin Mensajes Previos</h3>
                                    <p className="text-gray-500 text-xs">¡Inicia la conversación! Tu equipo recibirá una notificación inmediata.</p>
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const isMine = msg.senderId === currentUserId
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex flex-col max-w-[85%] md:max-w-[70%]",
                                                isMine ? "ml-auto items-end" : "mr-auto items-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "p-4 rounded-[2rem] text-sm leading-relaxed shadow-lg",
                                                    isMine
                                                        ? "bg-emerald-600 text-white rounded-tr-none"
                                                        : "bg-[#1a1c22] text-gray-200 border border-white/5 rounded-tl-none"
                                                )}
                                            >
                                                {msg.content}
                                            </div>
                                            <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-1.5 px-2">
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
                                    placeholder={`Enviar mensaje a ${selectedMember.name.split(' ')[0]}...`}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors placeholder:text-gray-700 shadow-inner"
                                />
                                <button
                                    type="submit"
                                    disabled={!newText.trim() || isSending}
                                    className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:grayscale group"
                                >
                                    {isSending ? (
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    ) : (
                                        <Send className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

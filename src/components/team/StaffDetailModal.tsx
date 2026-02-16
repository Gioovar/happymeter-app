import { useState, useEffect, useRef } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Phone,
    Mail,
    MessageSquare,
    CheckCircle2,
    Clock,
    AlertCircle,
    Copy,
    ExternalLink,
    Bot,
    Send,
    ShieldCheck,
    ShieldX
} from 'lucide-react'
import { toast } from 'sonner'
import { getInternalMessages, sendInternalMessage, markMessagesAsRead } from '@/actions/internal-communications'
import { toggleTeamMemberStatus } from '@/actions/team'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface StaffDetailModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    staff: any
}

export default function StaffDetailModal({ isOpen, onOpenChange, staff }: StaffDetailModalProps) {
    const [messages, setMessages] = useState<any[]>([])
    const [newMsg, setNewMsg] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [isToggling, setIsToggling] = useState(false)
    const [isActive, setIsActive] = useState(staff?.isActive ?? true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (staff) {
            setIsActive(staff.isActive)
        }
    }, [staff])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const fetchMessages = async () => {
        if (!staff || !staff.staffId || !staff.branchId) return
        try {
            const data = await getInternalMessages(staff.branchId, staff.staffId, staff.branchId)
            setMessages(data)
            // Mark as read
            await markMessagesAsRead(staff.branchId, staff.staffId, staff.branchId)
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    useEffect(() => {
        if (isOpen && staff) {
            fetchMessages()
            const interval = setInterval(fetchMessages, 10000)
            return () => clearInterval(interval)
        }
    }, [isOpen, staff])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    if (!staff) return null

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!newMsg.trim() || isSending) return

        setIsSending(true)
        try {
            const formData = new FormData()
            formData.append('content', newMsg)
            formData.append('senderId', staff.branchId)
            formData.append('receiverId', staff.staffId)
            formData.append('branchId', staff.branchId)

            await sendInternalMessage(formData)
            setNewMsg('')
            fetchMessages()
        } catch (error: any) {
            toast.error('Error al enviar mensaje')
        } finally {
            setIsSending(false)
        }
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copiado al portapapeles`)
    }

    const handleToggleStatus = async (checked: boolean) => {
        if (!staff || isToggling) return

        setIsToggling(true)
        const previousState = isActive
        setIsActive(checked) // Optimistic update

        try {
            const result = await toggleTeamMemberStatus(staff.staffId, checked)
            if (result.success) {
                toast.success(checked ? 'Operador activado' : 'Operador desactivado')
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            setIsActive(previousState)
            toast.error(error.message || 'Error al cambiar estado')
        } finally {
            setIsToggling(false)
        }
    }

    const { stats } = staff;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-[#0a0a0a] border-white/10 text-white overflow-hidden shadow-2xl p-0">
                <div className="flex h-[600px]">
                    {/* Left: Info & Stats */}
                    <div className="flex-1 p-8 space-y-8 border-r border-white/5 overflow-y-auto custom-scrollbar">
                        <DialogHeader>
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-xl overflow-hidden shrink-0">
                                    {staff.photo ? (
                                        <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                                    ) : (
                                        staff.name[0]
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <DialogTitle className="text-3xl font-extrabold tracking-tight truncate">{staff.name}</DialogTitle>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="secondary" className="bg-white/5 text-gray-400 border border-white/10 px-3 py-1.5 rounded-xl font-bold tracking-tight">
                                                {staff.jobTitle || staff.role}
                                            </Badge>
                                            <Badge className={cn(
                                                "px-3 py-1.5 rounded-xl font-bold border",
                                                stats.complianceRate >= 90 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                    stats.complianceRate >= 70 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                        "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                            )}>
                                                {stats.complianceRate}% Cumplimiento
                                            </Badge>
                                        </div>

                                        <div className={cn(
                                            "relative group/toggle flex items-center gap-5 px-6 py-3 rounded-[24px] border transition-all duration-500 shadow-2xl",
                                            isActive
                                                ? "bg-emerald-500/[0.03] border-emerald-500/20 shadow-emerald-500/5"
                                                : "bg-rose-500/[0.03] border-rose-500/20 shadow-rose-500/5"
                                        )}>
                                            {/* Dynamic Ambient Glow */}
                                            <div className={cn(
                                                "absolute inset-0 opacity-0 group-hover/toggle:opacity-100 transition-opacity duration-700 blur-2xl rounded-full -z-10",
                                                isActive ? "bg-emerald-500/10" : "bg-rose-500/10"
                                            )} />

                                            <div className="flex flex-col">
                                                <Label htmlFor="status-toggle" className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1.5">
                                                    Permiso de Acceso
                                                </Label>
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn(
                                                        "w-1.5 h-1.5 rounded-full animate-pulse",
                                                        isActive ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[11px] font-black tracking-widest uppercase",
                                                        isActive ? "text-emerald-400" : "text-rose-400"
                                                    )}>
                                                        {isActive ? 'Operador Activo' : 'Acceso Denegado'}
                                                    </span>
                                                </div>
                                            </div>

                                            <Switch
                                                id="status-toggle"
                                                checked={isActive}
                                                onCheckedChange={handleToggleStatus}
                                                disabled={isToggling}
                                                className={cn(
                                                    "scale-110",
                                                    "data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-gray-800",
                                                    "border border-white/10"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-8">
                            <section>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Reporte Operativo (Hoy)</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-white/5 shadow-inner">
                                        <p className="text-2xl font-black text-white">{stats.total}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Total</p>
                                    </div>
                                    <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                                        <p className="text-2xl font-black text-emerald-400">{stats.completed}</p>
                                        <p className="text-[10px] text-emerald-500/70 font-bold uppercase mt-1">Hechas</p>
                                    </div>
                                    <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10">
                                        <p className="text-2xl font-black text-rose-400">{stats.missed + stats.pending}</p>
                                        <p className="text-[10px] text-rose-500/70 font-bold uppercase mt-1">Faltan</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Información de Contacto</h3>
                                <div className="space-y-3">
                                    {staff.contact.phone && (
                                        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-white/5 group hover:border-violet-500/30 transition-all shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-violet-500/10 rounded-xl">
                                                    <Phone className="w-4 h-4 text-violet-400" />
                                                </div>
                                                <span className="text-sm font-bold tracking-tight">{staff.contact.phone}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-violet-500/10" onClick={() => copyToClipboard(staff.contact.phone, 'Teléfono')}>
                                                    <Copy className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-emerald-500/10" asChild>
                                                    <a href={`tel:${staff.contact.phone}`}>
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-white/5 group hover:border-violet-500/30 transition-all shadow-sm">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                                <Mail className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <span className="text-sm font-bold tracking-tight truncate">{staff.contact.email || 'Email no registrado'}</span>
                                        </div>
                                        {staff.contact.email && (
                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl" onClick={() => copyToClipboard(staff.contact.email!, 'Email')}>
                                                <Copy className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Right: Chat Box */}
                    <div className="w-[320px] bg-[#0f1115] flex flex-col h-full relative border-l border-white/5">
                        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Canal de Mensajería</span>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-black/40">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                    <MessageSquare className="w-8 h-8 text-gray-800 mb-3" />
                                    <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Sin mensajes previos</p>
                                </div>
                            ) : (
                                messages.map((m) => {
                                    const isMe = m.senderId === staff.branchId
                                    return (
                                        <div key={m.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                            <div className={cn(
                                                "px-4 py-3 rounded-2xl text-[13px] leading-tight max-w-[90%] shadow-md",
                                                isMe ? "bg-violet-600 text-white rounded-tr-none" : "bg-gray-800 text-gray-200 rounded-tl-none"
                                            )}>
                                                {m.content}
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-700 uppercase mt-1 px-1">
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 bg-black/60 border-t border-white/5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newMsg}
                                    onChange={(e) => setNewMsg(e.target.value)}
                                    placeholder="Instrucción rápida..."
                                    className="w-full bg-gray-950 border border-white/10 rounded-2xl py-3 px-4 text-xs pr-10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-gray-700"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMsg.trim() || isSending}
                                    className="absolute right-1.5 top-1.5 p-1.5 bg-violet-600 rounded-xl hover:bg-violet-500 disabled:opacity-50 transition-all text-white shadow-lg"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

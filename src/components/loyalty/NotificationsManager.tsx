
"use client"

import { useState, useEffect } from "react"
import { Send, Bell, History, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { sendLoyaltyNotification, getLoyaltyNotifications } from "@/actions/loyalty"

interface NotificationsManagerProps {
    programId: string
}

export default function NotificationsManager({ programId }: NotificationsManagerProps) {
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)

    const loadHistory = async () => {
        setIsLoadingHistory(true)
        // We use a dummy customerId to fetch just the program notifications list
        // In reality, getLoyaltyNotifications returns { notifications } regardless of customer
        const res = await getLoyaltyNotifications(programId, "dummy-admin")
        if (res.success && res.notifications) {
            setHistory(res.notifications)
        }
        setIsLoadingHistory(false)
    }

    useEffect(() => {
        loadHistory()
    }, [programId])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !message.trim()) return

        setIsSending(true)
        const res = await sendLoyaltyNotification(programId, title, message)

        if (res.success) {
            toast.success("Notificación enviada a todos los miembros")
            setTitle("")
            setMessage("")
            loadHistory()
        } else {
            toast.error(res.error || "Error al enviar")
        }
        setIsSending(false)
    }

    return (
        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-violet-400" />
                        Nueva Notificación
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        Envía un mensaje a todos los miembros de tu programa de lealtad.
                        Aparecerá en su tarjeta digital.
                    </p>

                    <form onSubmit={handleSend} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Título</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: ¡Hora Feliz este Viernes!"
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Mensaje</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Escribe los detalles aquí..."
                                rows={4}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600 resize-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSending || !title || !message}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Enviar Notificación
                        </button>
                    </form>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-400" />
                        Historial de Mensajes
                    </h3>

                    {isLoadingHistory ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No has enviado notificaciones aún.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((note) => (
                                <div key={note.id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h4 className="font-bold text-white">{note.title}</h4>
                                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{note.message}</p>
                                        </div>
                                        <span className="text-xs text-gray-600 whitespace-nowrap">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

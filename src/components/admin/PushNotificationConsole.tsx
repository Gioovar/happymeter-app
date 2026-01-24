'use client'

import { useState } from 'react'
import { Bell, Send, Users, User, Shield, Briefcase } from 'lucide-react'
import { toast } from 'sonner'

export default function PushNotificationConsole() {
    const [target, setTarget] = useState('ALL') // ALL, STAFF, CREATORS, SPECIFIC
    const [targetUserId, setTargetUserId] = useState('')
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [url, setUrl] = useState('')
    const [sending, setSending] = useState(false)

    const handleSend = async () => {
        if (!title || !body) {
            toast.error('Título y mensaje requeridos')
            return
        }

        setSending(true)
        try {
            const res = await fetch('/api/admin/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target,
                    targetUserId,
                    title,
                    body,
                    url
                })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success(`Enviado: ${data.sent} | Fallidos: ${data.failed}`)
                setTitle('')
                setBody('')
            } else {
                toast.error(data.error || 'Error enviando notificación')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error de conexión')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Bell className="text-violet-500" /> Consola de Notificaciones Push
            </h2>

            <div className="space-y-6">
                {/* Target Audience */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Audiencia</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { id: 'ALL', label: 'Todos', icon: Users },
                            { id: 'STAFF', label: 'Staff', icon: Shield },
                            { id: 'CREATORS', label: 'Creadores', icon: Briefcase },
                            { id: 'SPECIFIC', label: 'Usuario ID', icon: User },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTarget(t.id)}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition ${target === t.id ? 'bg-violet-500/20 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                            >
                                <t.icon className="w-5 h-5" />
                                <span className="text-xs font-bold">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {target === 'SPECIFIC' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
                        <input
                            type="text"
                            value={targetUserId}
                            onChange={(e) => setTargetUserId(e.target.value)}
                            placeholder="user_..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Título</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Nueva funcionalidad..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Link (Opcional)</label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="/dashboard/..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Mensaje</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Escribe tu mensaje aquí..."
                        rows={4}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 resize-none"
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Enviar Notificación
                    </button>
                </div>
            </div>
        </div>
    )
}

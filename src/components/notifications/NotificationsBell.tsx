'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Check, Trash2, X, AlertOctagon, Info, Megaphone, Loader2, Trophy, BarChart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'


interface NotificationsBellProps {
    align?: 'left' | 'right'
}

export default function NotificationsBell({ align = 'right' }: NotificationsBellProps) {
    // ... existing code ...

    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const bellRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications)
                setUnreadCount(data.unreadCount)
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 60s
        const interval = setInterval(fetchNotifications, 60000)
        return () => clearInterval(interval)
    }, [])

    const markAsRead = async (id?: string) => {
        // Optimistic update
        if (id) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        }

        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ notificationId: id, markAll: !id })
            })
        } catch (error) {
            console.error('Failed to mark read', error)
        }
    }

    const handleNotificationClick = async (notif: any) => {
        setLoadingId(notif.id)
        await markAsRead(notif.id)
        setIsOpen(false)

        if (notif.meta?.responseId) {
            router.push(`/dashboard/responses/${notif.meta.responseId}`)
        } else if (notif.type === 'ACHIEVEMENT') {
            router.push('/dashboard/achievements')
        } else if (notif.type === 'REPORT') {
            const endDate = new Date(notif.createdAt)
            const startDate = subDays(endDate, 15)
            const query = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }).toString()
            router.push(`/dashboard/analytics?${query}`)
        }

        // Reset loading after delay
        setTimeout(() => setLoadingId(null), 1000)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'CRISIS': return <AlertOctagon className="w-5 h-5 text-red-500" />
            case 'SYSTEM': return <Megaphone className="w-5 h-5 text-blue-500" />
            case 'ACHIEVEMENT': return <Trophy className="w-5 h-5 text-yellow-500" />
            case 'REPORT': return <BarChart className="w-5 h-5 text-purple-500" />
            default: return <Info className="w-5 h-5 text-gray-500" />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'CRISIS': return 'bg-red-500/10 border-red-500/20'
            case 'SYSTEM': return 'bg-blue-500/10 border-blue-500/20'
            case 'ACHIEVEMENT': return 'bg-yellow-500/10 border-yellow-500/20'
            case 'REPORT': return 'bg-purple-500/10 border-purple-500/20'
            default: return 'bg-white/5 border-white/5'
        }
    }

    return (
        <div className="relative" ref={bellRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute mt-3 w-[360px] md:w-[400px] bg-[#13111C] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#13111C]">
                            <h3 className="font-bold text-white text-sm">Notificaciones</h3>
                            <div className="flex gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAsRead()}
                                        className="text-[10px] text-violet-400 hover:text-violet-300 transition flex items-center gap-1 bg-violet-500/10 px-2 py-1 rounded-md"
                                    >
                                        <Check className="w-3 h-3" /> Marcar leídas
                                    </button>
                                )}
                                {notifications.some(n => n.isRead) && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm('¿Borrar todas las notificaciones leídas?')) return
                                            setNotifications(prev => prev.filter(n => !n.isRead))
                                            try {
                                                await fetch('/api/notifications', { method: 'DELETE' })
                                            } catch (e) { console.error(e) }
                                        }}
                                        className="text-[10px] text-gray-500 hover:text-red-400 transition flex items-center gap-1 hover:bg-red-500/10 px-2 py-1 rounded-md"
                                        title="Eliminar leídas"
                                    >
                                        <Trash2 className="w-3 h-3" /> Limpiar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No tienes notificaciones.
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-4 hover:bg-white/5 transition relative group 
                                                ${!notif.isRead ? 'bg-white/[0.02]' : ''} 
                                                ${notif.meta?.responseId ? 'cursor-pointer' : 'cursor-default'}
                                                ${loadingId === notif.id ? 'opacity-70 pointer-events-none' : ''}
                                            `}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${getBgColor(notif.type)}`}>
                                                    {loadingId === notif.id ? (
                                                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                                    ) : (
                                                        getIcon(notif.type)
                                                    )}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-white' : 'text-gray-400'}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <span className="text-[10px] text-gray-600 whitespace-nowrap">
                                                            {format(new Date(notif.createdAt), "d MMM", { locale: es })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-3">
                                                        {notif.message}
                                                    </p>

                                                    {/* Optional text link, though whole card is clickable now */}
                                                    {notif.meta?.responseId && (
                                                        <span className="block w-fit text-[10px] text-violet-500 font-bold mt-2">
                                                            {loadingId === notif.id ? 'Cargando...' : 'Ver Respuesta'}
                                                        </span>
                                                    )}
                                                </div>

                                                {!notif.isRead && !loadingId && (
                                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-violet-500" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {/* <div className="p-3 bg-white/5 border-t border-white/5 text-center">
                            <button className="text-xs text-gray-500 hover:text-white transition">Ver historial completo</button>
                        </div> */}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

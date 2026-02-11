'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Check, Trash2, X, AlertOctagon, Info, Megaphone, Loader2, Trophy, BarChart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { useNotifications } from '@/context/NotificationContext'


interface NotificationsBellProps {
    align?: 'left' | 'right'
}

export default function NotificationsBell({ align = 'right', currentBranchId }: NotificationsBellProps & { currentBranchId?: string }) {
    const { notifications, unreadCount, markAsRead, deleteRead, loadingId, setLoadingId, requestPushPermission } = useNotifications()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const bellRef = useRef<HTMLDivElement>(null)

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredNotifications = notifications.filter(n => {
        // 1. If no context, show all
        if (!currentBranchId) return true

        // 2. Always show Global types
        if (['SYSTEM', 'ACHIEVEMENT', 'INFO'].includes(n.type)) return true

        // 3. Filter by Branch ID (Origin of the notification)
        if (n.meta?.branchId) {
            return n.meta.branchId === currentBranchId
        }

        return false
    })

    const handleClick = (notif: any) => {
        setLoadingId(notif.id)

        // Optimistic update handled by context usually, but we call markAsRead
        markAsRead(notif.id)
        setIsOpen(false)

        if (notif.meta?.responseId) {
            router.push(`/dashboard/responses?responseId=${notif.meta.responseId}`)
        } else if (notif.meta?.url) { // Support custom URLs from Admin Push
            router.push(notif.meta.url)
        } else if (notif.type === 'ACHIEVEMENT') {
            router.push('/dashboard/achievements')
        } else if (notif.type === 'REPORT') {
            const endDate = new Date(notif.createdAt)
            const startDate = subDays(endDate, 15)
            const query = new URLSearchParams({
                auto: 'true',
                from: startDate.toISOString(),
                to: endDate.toISOString()
            }).toString()

            const toastId = toast.loading("🔄 Conectando con tu reporte...", {
                description: "Preparando análisis actualizado. Por favor espera."
            })

            // Dismiss toast after 3 seconds to prevent stacking
            setTimeout(() => toast.dismiss(toastId), 3000)

            if (notif.meta?.surveyId) {
                router.push(`/dashboard/reports/${notif.meta.surveyId}?${query}`)
            } else {
                router.push(`/dashboard/reports?${query}`)
            }
        }

        setTimeout(() => setLoadingId(null), 1000)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'CRISIS': return <AlertOctagon className="w-5 h-5 text-red-500" />
            case 'SYSTEM': return <Megaphone className="w-5 h-5 text-blue-500" />
            case 'ACHIEVEMENT': return <Trophy className="w-5 h-5 text-yellow-500" />
            case 'REPORT': return <BarChart className="w-5 h-5 text-blue-400" /> // Changed from purple to blue
            default: return <Info className="w-5 h-5 text-gray-500" />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'CRISIS': return 'bg-red-500/10 border-red-500/20'
            case 'SYSTEM': return 'bg-blue-500/10 border-blue-500/20'
            case 'ACHIEVEMENT': return 'bg-yellow-500/10 border-yellow-500/20'
            case 'REPORT': return 'bg-blue-500/10 border-blue-500/20' // Changed from purple to blue
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
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#13111C]">
                            <h3 className="font-bold text-white text-sm">Notificaciones</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => requestPushPermission()}
                                    className="text-[10px] text-green-400 hover:text-green-300 transition flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-md"
                                >
                                    <Bell className="w-3 h-3" /> Activar Push
                                </button>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAsRead()}
                                        className="text-[10px] text-blue-400 hover:text-blue-300 transition flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-md"
                                    >
                                        <Check className="w-3 h-3" /> Marcar leídas
                                    </button>
                                )}
                                {notifications.some(n => n.isRead) && (
                                    <button
                                        onClick={async () => {
                                            if (!confirm('¿Borrar todas las notificaciones leídas?')) return
                                            await deleteRead()
                                        }}
                                        className="text-[10px] text-gray-500 hover:text-red-400 transition flex items-center gap-1 hover:bg-red-500/10 px-2 py-1 rounded-md"
                                        title="Eliminar leídas"
                                    >
                                        <Trash2 className="w-3 h-3" /> Limpiar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Lista */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {filteredNotifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    No tienes notificaciones.
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {filteredNotifications
                                        .map(notif => (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleClick(notif)}
                                                className={`p-4 hover:bg-white/5 transition relative group 
                                                ${!notif.isRead ? 'bg-blue-500/5 border-l-2 border-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]' : 'border-l-2 border-transparent'} 
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
                                                        <div className="flex justify-between items-start gap-2 pr-2"> {/* Added pr-2 to avoid right edge tightness */}
                                                            <h4 className={`text-sm font-semibold ${!notif.isRead ? 'text-white' : 'text-gray-400'}`}>
                                                                {notif.title}
                                                            </h4>
                                                            <span className="text-[10px] text-gray-600 whitespace-nowrap pt-1">
                                                                {(() => {
                                                                    try {
                                                                        return format(new Date(notif.createdAt), "d MMM", { locale: es })
                                                                    } catch (e) {
                                                                        return ""
                                                                    }
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-3">
                                                            {notif.message}
                                                        </p>

                                                        {/* Enlace de texto opcional, aunque ahora toda la tarjeta es clicable */}
                                                        {notif.meta?.responseId && (
                                                            <span className="block w-fit text-[10px] text-blue-500 font-bold mt-2">
                                                                {loadingId === notif.id ? 'Cargando...' : 'Ver Respuesta'}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {!notif.isRead && !loadingId && (
                                                        // Moved dot to be left-aligned in the flex or relative to title instead of absolute top-right overlay
                                                        // Actually, keeping absolute but moving it slightly or changing it to be part of the layout?
                                                        // Cleanest fix: Remove the dot if we have the blue border/bg, OR position it 'top-4 right-2' but ensure text has padding.
                                                        // I'll effectively remove the big absolute overlay if it's clashing and rely on the border/bg which is cleaner.
                                                        // User explicitly complained about the big circle.
                                                        // But let's keep a small indicator.
                                                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

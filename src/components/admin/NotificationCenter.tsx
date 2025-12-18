'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
    Bell,
    Check,
    Trash2,
    Megaphone,
    AlertOctagon,
    CreditCard,
    UserPlus,
    ShieldAlert,
    Trophy,
    Calendar,
    X,
    Settings,
    ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

// Types
type Category = 'ALL' | 'SYSTEM' | 'FINANCE' | 'USERS' | 'SECURITY'

export default function NotificationCenter() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<Category>('ALL')
    const [loading, setLoading] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Fetch Notifications
    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications')
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error)
        } finally {
            setLoading(false)
        }
    }

    // Initial Fetch & Polling
    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (isOpen) fetchNotifications()
    }, [isOpen])

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'ALL') return true
        if (activeTab === 'SYSTEM') return !(n.type.includes('PAYMENT') || n.type.includes('USER') || n.type.includes('SECURITY'))
        if (activeTab === 'FINANCE') return n.type.includes('PAYMENT') || n.type.includes('FINANCE')
        if (activeTab === 'USERS') return n.type.includes('USER') || n.type.includes('ACHIEVEMENT') || n.type.includes('VISIT')
        if (activeTab === 'SECURITY') return n.type.includes('SECURITY')
        return true
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        await fetch('/api/notifications', {
            method: 'PATCH',
            body: JSON.stringify({ markAll: true })
        })
    }

    const clearRead = async () => {
        setNotifications(prev => prev.filter(n => !n.isRead))
        await fetch('/api/notifications', { method: 'DELETE' })
    }

    const getNotificationLink = (notif: any) => {
        const type = notif.type
        // Mapping based on "God Mode" dashboard routes
        if (type.includes('USER') || type.includes('ACHIEVEMENT')) return '/admin/users'
        if (type.includes('VISIT')) return '/admin/places'
        if (type.includes('PAYMENT') || type.includes('FINANCE')) return '/admin/stats'
        if (type.includes('SECURITY')) return '/admin'
        return '/admin'
    }

    const handleNotificationClick = async (notif: any) => {
        if (!notif.isRead) {
            setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n))
            fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ notificationId: notif.id })
            }).catch(console.error)
        }

        const link = getNotificationLink(notif)
        setIsOpen(false)
        router.push(link)
    }

    // Icons map
    const getIcon = (type: string) => {
        if (type === 'CRISIS' || type.includes('CRISIS')) return <AlertOctagon className="w-5 h-5 text-red-500" />
        if (type === 'PAYMENT' || type === 'FINANCE' || type.includes('PAYMENT')) return <CreditCard className="w-5 h-5 text-green-500" />
        if (type === 'USER' || type === 'ACHIEVEMENT' || type === 'VISIT') return <UserPlus className="w-5 h-5 text-purple-500" />
        if (type === 'SECURITY') return <ShieldAlert className="w-5 h-5 text-orange-500" />
        return <Megaphone className="w-5 h-5 text-blue-500" />
    }

    return (
        <div className="relative" ref={containerRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-white/5 transition-colors group"
            >
                <Bell className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-[#0E0918]" />
                )}
            </button>

            {/* Popover / Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "absolute right-[-3.5rem] md:right-0 top-full mt-2 bg-[#13111C] border border-white/10 shadow-2xl overflow-hidden flex flex-col z-[100]",
                            "w-[90vw] sm:w-[380px] md:w-[450px] rounded-2xl max-h-[85vh] origin-top-right"
                        )}
                    >
                        {/* Header */}
                        <div className="p-5 pb-2 bg-[#13111C] shrink-0">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-white tracking-tight">Notificaciones</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-[#252033] border border-white/5 text-xs text-indigo-300 font-medium">
                                            {unreadCount} nuevas
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Centro de control y alertas del sistema</p>
                        </div>

                        {/* Tabs */}
                        <div className="px-5 py-2 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
                            {[
                                { id: 'ALL', label: 'Todo' },
                                { id: 'SYSTEM', label: 'Sistema' },
                                { id: 'FINANCE', label: 'Finanzas' },
                                { id: 'USERS', label: 'Usuarios' },
                                { id: 'SECURITY', label: 'Seguridad' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                                        activeTab === tab.id
                                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                            : "text-gray-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Sub-actions */}
                        <div className="px-5 py-3 flex justify-between items-center bg-[#13111C] border-b border-white/5 shrink-0">
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                <Check className="w-3.5 h-3.5" /> Marcar todas leídas
                            </button>
                            <button
                                onClick={clearRead}
                                className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Limpiar leídas
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0E0918]">
                            {loading && notifications.length === 0 ? (
                                <div className="p-8 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="p-12 flex flex-col items-center text-center text-gray-500 opacity-50 gap-3">
                                    <Bell className="w-10 h-10" />
                                    <p className="text-sm">Sin notificaciones en esta categoría</p>
                                </div>
                            ) : (
                                <div>
                                    {filteredNotifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={cn(
                                                "p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-4 relative group",
                                                !notif.isRead ? "bg-[#1B1626]" : ""
                                            )}
                                        >
                                            {/* Icon */}
                                            <div className="shrink-0 pt-0.5">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center border bg-[#13111C]",
                                                    "border-white/10 text-gray-400 group-hover:border-white/20 group-hover:text-white transition-colors"
                                                )}>
                                                    {getIcon(notif.type)}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h4 className="text-sm font-semibold text-white leading-tight">
                                                        {notif.title}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-500 whitespace-nowrap ml-2">
                                                        {format(new Date(notif.createdAt || notif.timestamp || new Date()), "d MMM", { locale: es })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 group-hover:text-gray-300 transition-colors">
                                                    {notif.message}
                                                </p>
                                            </div>

                                            {/* Unread Dot */}
                                            {!notif.isRead && (
                                                <div className="absolute top-4 right-2 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-[#13111C] border-t border-white/5 flex justify-between items-center shrink-0">
                            <button
                                onClick={() => { setIsOpen(false); router.push('/admin/settings') }}
                                className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
                            >
                                <Settings className="w-4 h-4" /> Configurar alertas
                            </button>
                            <button
                                onClick={() => { setIsOpen(false); router.push('/admin/audit') }}
                                className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors"
                            >
                                <span className='mr-1'>Ver historial completo</span>
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

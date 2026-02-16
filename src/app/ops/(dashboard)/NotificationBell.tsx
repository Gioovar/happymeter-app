'use client'

import { useState, useEffect } from 'react'
import { Bell, MessageSquare, CheckSquare, AlertCircle, X, ChevronRight } from 'lucide-react'
import { getInternalNotifications, markInternalNotificationRead } from '@/actions/internal-communications'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export default function NotificationBell({ memberId, branchId }: { memberId: string, branchId?: string }) {
    const [notifications, setNotifications] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const fetchNotifications = async () => {
        if (!memberId) return
        try {
            const data = await getInternalNotifications(memberId)
            setNotifications(data)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll for notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [memberId])

    const unreadCount = notifications.length

    const handleAction = async (notif: any) => {
        await markInternalNotificationRead(notif.id)
        setIsOpen(false)
        fetchNotifications()
        if (notif.actionUrl) {
            router.push(notif.actionUrl)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'NEW_MESSAGE': return <MessageSquare className="w-4 h-4 text-violet-400" />
            case 'TASK_REMINDER': return <CheckSquare className="w-4 h-4 text-emerald-400" />
            case 'WARNING': return <AlertCircle className="w-4 h-4 text-rose-400" />
            default: return <Bell className="w-4 h-4 text-gray-400" />
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-200 transition-all duration-300 relative group"
            >
                <Bell className={cn("w-6 h-6 transition-transform group-hover:scale-110", unreadCount > 0 && "animate-pulse")} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0a0a0a] shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-4 w-80 bg-[#0f1115]/90 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden z-[120] animate-in slide-in-from-top-2 duration-300">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Notificaciones</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                        <Bell className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Todo al día</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {notifications.map((n) => (
                                        <button
                                            key={n.id}
                                            onClick={() => handleAction(n)}
                                            className="w-full flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group text-left"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-white tracking-tight mb-0.5">{n.title}</p>
                                                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">{n.body}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-700 mt-1 transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Fin de las notificaciones</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

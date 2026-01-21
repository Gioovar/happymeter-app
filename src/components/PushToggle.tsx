'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'
import { Bell, BellRing, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PushToggle() {
    const { isSubscribed, loading, permission, subscribe } = usePushNotifications()

    const handleSubscribe = async () => {
        // toast('Por favor permite las notificaciones en tu navegador', { icon: '🔔' })
        const result = await subscribe()
        if (result.success) {
            toast.success('¡Notificaciones activadas!')
        } else {
            toast.error('Error: ' + (result as any).error)
        }
    }

    if (permission === 'denied') {
        return (
            <div className="text-xs text-red-400 flex items-center gap-1 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                <BellRing className="w-3 h-3" /> Notificaciones bloqueadas
            </div>
        )
    }

    if (isSubscribed) {
        return (
            <div className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <BellRing className="w-3 h-3" /> Notificaciones activas
            </div>
        )
    }

    return (
        <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex items-center gap-2 px-3 md:px-5 py-2.5 rounded-xl bg-violet-600/10 text-violet-300 hover:bg-violet-600/20 transition text-sm font-bold border border-violet-500/20 hover:border-violet-500/40"
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
            <span className="hidden md:inline">Activar Alertas</span>
        </button>
    )
}

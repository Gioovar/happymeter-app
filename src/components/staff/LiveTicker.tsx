'use client'

import { Bell, DollarSign, UserPlus, Zap } from 'lucide-react'

interface LiveEvent {
    id: string
    type: 'SALE' | 'SIGNUP' | 'VISIT'
    message: string
    time: string
}

export default function LiveTicker() {
    // Mock data for initial render - ideally this comes from props or a websocket
    const events: LiveEvent[] = [
        { id: '1', type: 'SALE', message: 'Nueva Venta: Plan Pro ($29)', time: 'Ahora' },
        { id: '2', type: 'VISIT', message: 'Juan Pérez llegó a Café Botánico', time: 'Hace 2m' },
        { id: '3', type: 'SIGNUP', message: 'Nuevo Creador: @gtrendyy', time: 'Hace 5m' },
        { id: '4', type: 'SALE', message: 'Nueva Venta: Plan Básico ($9)', time: 'Hace 12m' },
        { id: '5', type: 'VISIT', message: 'María hizo check-in en Mango Mango', time: 'Hace 15m' },
    ]

    const getIcon = (type: string) => {
        switch (type) {
            case 'SALE': return <DollarSign className="w-3 h-3 text-green-400" />
            case 'SIGNUP': return <UserPlus className="w-3 h-3 text-blue-400" />
            case 'VISIT': return <Zap className="w-3 h-3 text-yellow-400" />
            default: return <Bell className="w-3 h-3 text-gray-400" />
        }
    }

    return (
        <div className="w-full bg-black/40 border-y border-white/5 overflow-hidden h-10 flex items-center">
            <div className="flex items-center gap-8 animate-infinite-scroll whitespace-nowrap pl-4">
                {/* Duplicate list to create seamless loop effect */}
                {[...events, ...events, ...events].map((event, i) => (
                    <div key={`${event.id}-${i}`} className="flex items-center gap-2 text-xs font-medium text-gray-300">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/5 border border-white/5">
                            {getIcon(event.type)}
                        </span>
                        <span className="text-white">{event.message}</span>
                        <span className="text-gray-600">|</span>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-infinite-scroll {
                    animation: scroll 60s linear infinite;
                }
                .animate-infinite-scroll:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    )
}

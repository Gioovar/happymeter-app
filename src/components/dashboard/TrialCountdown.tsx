
'use client'

import { useEffect, useState } from 'react'
import { Clock, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrialCountdownProps {
    createdAt: string | Date | undefined
    isCollapsed?: boolean
}

export default function TrialCountdown({ createdAt, isCollapsed }: TrialCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null)
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        if (!createdAt) return

        const calculateTimeLeft = () => {
            const start = new Date(createdAt).getTime()
            const trialDuration = 7 * 24 * 60 * 60 * 1000 // 7 Days
            const end = start + trialDuration
            const now = new Date().getTime()
            const difference = end - now

            if (difference <= 0) {
                setIsExpired(true)
                setTimeLeft(null)
                return
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24))
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((difference % (1000 * 60)) / 1000)

            setTimeLeft({ days, hours, minutes, seconds })
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000) // Update every second

        return () => clearInterval(timer)
    }, [createdAt])

    if (!createdAt || isExpired) return null

    // Format: 6d 23h 35m 34s
    const displayText = timeLeft
        ? `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
        : 'Calculando...'

    const isUrgent = timeLeft && timeLeft.days <= 2

    if (isCollapsed) {
        return (
            <div className="px-2 py-4 flex justify-center">
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center relative group",
                    isUrgent ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                )}>
                    <Clock className="w-4 h-4" />
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                        {displayText}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="px-4 pb-2">
            <div className={cn(
                "rounded-xl p-3 border border-dashed transition-all",
                isUrgent
                    ? "bg-red-950/30 border-red-500/30 text-red-200"
                    : "bg-blue-950/30 border-blue-500/30 text-blue-200"
            )}>
                <div className="flex items-center gap-3 mb-1">
                    <Clock className={cn("w-4 h-4", isUrgent ? "animate-pulse text-red-400" : "text-blue-400")} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                        Modo Prueba
                    </span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-sm font-medium opacity-80">
                        {displayText}
                    </span>
                    {/* Visual Progress Bar (Inverse) */}
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full transition-all duration-1000", isUrgent ? "bg-red-500" : "bg-blue-500")}
                            style={{ width: timeLeft ? `${(timeLeft.days / 7) * 100}%` : '0%' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

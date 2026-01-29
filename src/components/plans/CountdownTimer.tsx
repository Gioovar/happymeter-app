'use client'

import React, { useState } from 'react'

export function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 13, minutes: 58, seconds: 0 })
    const [mounted, setMounted] = useState(false)

    React.useEffect(() => {
        setMounted(true)
        const STORAGE_KEY = 'happy_launch_start_v2'
        const DURATION = (3 * 24 * 60 * 60 * 1000) + (13 * 60 * 60 * 1000) + (58 * 60 * 1000) // 3d 13h 58m

        let startTime = localStorage.getItem(STORAGE_KEY)
        if (!startTime) {
            startTime = Date.now().toString()
            localStorage.setItem(STORAGE_KEY, startTime)
        }

        const endTime = parseInt(startTime) + DURATION

        const interval = setInterval(() => {
            const now = Date.now()
            const diff = endTime - now

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
                clearInterval(interval)
                return
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24))
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            setTimeLeft({ days, hours, minutes, seconds })
        }, 1000)

        return () => clearInterval(interval)
    }, [])

    if (!mounted) return null

    return (
        <div className="inline-flex items-center gap-3 bg-red-900/10 border border-red-500/20 rounded-lg py-1 px-3">
            <span className="text-[#FF4D4D] font-bold text-[10px] md:text-xs uppercase animate-pulse shrink-0">🔥 Oferta termina en:</span>
            <div className="flex items-center gap-1 text-white text-xs md:text-sm font-mono font-bold">
                <span>{timeLeft.days}d</span>:
                <span>{timeLeft.hours}h</span>:
                <span>{timeLeft.minutes}m</span>:
                <span className="text-[#FF4D4D]">{timeLeft.seconds}s</span>
            </div>
        </div>
    )
}

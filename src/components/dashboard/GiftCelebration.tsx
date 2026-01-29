'use client'

import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { Check, Heart, Trophy, X, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function GiftCelebration({ userId }: { userId: string }) {
    const [gift, setGift] = useState<{ plan: string, message: string, id: string } | null>(null)
    const router = useRouter()

    useEffect(() => {
        // Poll for gift notifications every 10 seconds
        const checkGifts = async () => {
            try {
                // We fetch unread system notifications that are gifts
                // Since we don't have a direct "getUnreadGifts" API, we can fetch notifications 
                // and filter on the client or add a small specific route.
                // For simplicity/speed, let's hit a specialized endpoint or reuse notifications API?
                // Actually, let's create a small client-side fetch wrapper around existing or new API.
                // To avoid complexity, we can assume a server action 'checkGiftStatus' or similar.

                // Let's use a server action if possible, or fetch existing notifications route.
                // Assuming /api/notifications exists.
                const res = await fetch('/api/notifications?unreadOnly=true')
                if (!res.ok) return

                const notifications = await res.json()
                const giftNotif = notifications.find((n: any) => n.meta?.isGift === true && !n.isRead)

                if (giftNotif) {
                    setGift({
                        id: giftNotif.id,
                        plan: giftNotif.meta.plan || 'PREMIUM',
                        message: giftNotif.message
                    })
                    triggerCelebration()
                }

            } catch (error) {
                console.error("Error checking gifts", error)
            }
        }

        const interval = setInterval(checkGifts, 10000) // Check every 10s
        checkGifts() // Initial check

        return () => clearInterval(interval)
    }, [])

    const triggerCelebration = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }

    const handleClaim = async () => {
        if (!gift) return
        try {
            await fetch(`/api/notifications/${gift.id}/read`, { method: 'POST' })
            setGift(null)
            toast.success("¡Disfruta tu nuevo plan!")
            router.refresh()
        } catch (e) {
            console.error(e)
            setGift(null)
        }
    }

    if (!gift) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-[#111] border border-orange-500/50 w-full max-w-sm rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">

                {/* Glow Effects */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500" />
                <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-500/20 blur-[60px] rounded-full" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-red-500/20 blur-[60px] rounded-full" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 animate-bounce">
                        <Trophy className="w-10 h-10 text-white fill-current" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
                        ¡Felicidades!
                    </h2>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
                        <p className="text-gray-300 text-sm mb-2">Has recibido un upgrade de cortesía:</p>
                        <p className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-yellow-400">
                            PLAN {gift.plan}
                        </p>
                    </div>

                    <p className="text-xs text-gray-500 max-w-[200px] mb-8">
                        El equipo de administración te ha otorgado acceso completo. ¡Aprovéchalo!
                    </p>

                    <button
                        onClick={handleClaim}
                        className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-xl"
                    >
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                        ¡Muchas Gracias!
                    </button>
                </div>
            </div>
        </div>
    )
}

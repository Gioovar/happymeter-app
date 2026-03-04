'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getGlobalWallet, clearGlobalLoyaltySession } from "@/actions/loyalty-global"
import { Loader2, Plus, QrCode, LogOut, Store, CreditCard } from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { usePushNotifications } from "@/hooks/usePushNotifications"

export default function LoyaltyWalletPage() {
    const [cards, setCards] = useState<any[]>([])
    const [phone, setPhone] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Initialize push notifications if we have a phone/session
    usePushNotifications('LOYALTY', phone || null)

    useEffect(() => {
        loadWallet()
    }, [])

    const loadWallet = async () => {
        setIsLoading(true)
        const res = await getGlobalWallet()
        if (!res.success) {
            toast.error(res.error)
            router.push('/loyalty/login')
        } else {
            setCards(res.cards || [])
            setPhone(res.phone || "")
        }
        setIsLoading(false)
    }

    const handleLogout = async () => {
        await clearGlobalLoyaltySession()
        router.push('/loyalty/login')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">HappyMeters</h1>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{phone}</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-colors group"
                >
                    <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                </button>
            </header>

            <main className="p-6 max-w-md mx-auto">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Mis Tarjetas</h2>
                        <p className="text-sm text-gray-400 mt-1">Tu billetera de lealtad</p>
                    </div>
                </div>

                {cards.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-white/5 border border-white/10 rounded-3xl mt-8">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <QrCode className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Billetera Vacía</h3>
                        <p className="text-sm text-gray-400 mb-6">Aún no te has unido a ningún programa de lealtad.</p>

                        <button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                            <Plus className="w-5 h-5" /> Escanear Código QR
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 relative">
                        {cards.map((card, index) => {
                            const isBlocked = card.program.user?.subscriptionStatus === 'EXPIRED' || card.program.user?.subscriptionStatus === 'SUSPENDED'

                            return (
                                <motion.div
                                    key={card.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => router.push(`/loyalty/${card.programId}`)}
                                    className="relative overflow-hidden rounded-3xl cursor-pointer group shadow-xl active:scale-95 transition-transform"
                                    style={{
                                        backgroundColor: card.program.themeColor || '#8b5cf6',
                                    }}
                                >
                                    {/* Card Design */}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />

                                    {/* App Store style gradient overlay */}
                                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent z-10" />

                                    <div className="relative z-20 p-6 flex flex-col h-48 justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="w-12 h-12 bg-white rounded-2xl p-0.5 shadow-lg overflow-hidden shrink-0">
                                                {card.program.logoUrl || card.program.user?.logoUrl ? (
                                                    <img src={card.program.logoUrl || card.program.user?.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
                                                        <Store className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <div className="bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20 shadow-sm flex items-center gap-1.5 inline-flex">
                                                    <CreditCard className="w-3 h-3 opacity-70" />
                                                    {card.tier ? card.tier.name : "Nivel Básico"}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            {isBlocked && (
                                                <span className="inline-block px-2 py-0.5 bg-red-500/80 backdrop-blur-md text-white text-[10px] font-bold rounded-lg mb-2 uppercase tracking-wide">
                                                    Inactivo Temporalmente
                                                </span>
                                            )}
                                            <h3 className="text-xl font-bold text-white drop-shadow-md truncate">{card.program.businessName}</h3>
                                            <div className="flex gap-4 mt-1">
                                                <p className="text-sm font-medium text-white/90 drop-shadow-sm">
                                                    {card.currentVisits} <span className="text-xs opacity-70">Visitas</span>
                                                </p>
                                                <p className="text-sm font-medium text-white/90 drop-shadow-sm">
                                                    {card.currentPoints} <span className="text-xs opacity-70">Puntos</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* Fab for Add Card - Fixed at bottom */}
            <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
                <button className="pointer-events-auto bg-white hover:bg-gray-100 text-black shadow-2xl shadow-white/10 px-6 py-4 rounded-full font-bold flex items-center gap-2 active:scale-95 transition-all w-fit mx-auto border border-black/10">
                    <Plus className="w-5 h-5" /> Agregar Nueva Tarjeta
                </button>
            </div>
        </div>
    )
}

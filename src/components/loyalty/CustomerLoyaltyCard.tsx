"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { unlockReward } from "@/actions/loyalty"
import { toast } from "sonner"
import { Star, Gift, Check, Lock, ChevronRight, Menu, CreditCard, Sparkles, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomerLoyaltyCardProps {
    customer: any // Prisma type with relations
    filterType?: "all" | "visits" | "points"
    children?: React.ReactNode
    className?: string
}

export function CustomerLoyaltyCard({ customer, filterType = "all", children, className }: CustomerLoyaltyCardProps) {
    // ... existing hook logic
    const { program, visits, currentVisits } = customer
    const [selectedReward, setSelectedReward] = useState<any | null>(null)
    const [showQr, setShowQr] = useState(false)

    // Find current unlocked rewards (pending redemption)
    const pendingRedemptions = customer.redemptions ? customer.redemptions.filter((r: any) => r.status === 'PENDING') : []

    const handleUnlock = async (rewardId: string) => {
        // ... existing unlock logic
        const res = await unlockReward(customer.id, rewardId)
        if (res.success) {
            toast.success("¡Premio desbloqueado! Muestra el código al personal.")
            window.location.reload()
        } else {
            toast.error(res.error || "No tienes suficientes visitas")
        }
    }

    // Filter rewards based on filterType
    const displayedRewards = program?.rewards?.filter((reward: any) => {
        if (filterType === "visits") return reward.costInVisits > 0
        if (filterType === "points") return reward.costInPoints > 0
        return true
    }) || []

    const tierColor = customer.tier?.color || "#fbbf24" // Default Gold
    const tierName = customer.tier?.name || "Miembro"

    return (
        <div className={cn("h-full w-full bg-[#0a0a0f] text-white relative overflow-hidden font-sans", className)}>
            {/* Dynamic Background Glows */}
            <div
                className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] rounded-full blur-[100px] pointer-events-none opacity-40"
                style={{ backgroundColor: tierColor }}
            />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-900/30 rounded-full blur-[80px] pointer-events-none" />

            {/* Scrollable Content */}
            <div className="absolute inset-0 overflow-y-auto p-6 pb-32 scrollbar-hide">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{program?.businessName || "HappyMember"}</h1>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">Membresía Digital</p>
                    </div>
                    <button className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <Menu className="w-5 h-5 text-gray-300" />
                    </button>
                </div>

                <div className="space-y-6 relative z-10">
                    {/* PRIMARY CARD (Membership Status) */}
                    <div
                        onClick={() => setShowQr(!showQr)}
                        className="w-full aspect-[1.6] rounded-3xl p-6 relative overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] cursor-pointer group"
                    >
                        {/* Card Background with customized gradient */}
                        <div className="absolute inset-0 bg-[#16161e] z-0" />

                        {/* Dynamic Gradient Overlay */}
                        <div
                            className="absolute inset-0 z-0 opacity-40 transition-colors duration-500"
                            style={{
                                background: `linear-gradient(135deg, ${tierColor}20 0%, ${tierColor}05 100%)`
                            }}
                        />

                        {/* Card Gloss Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 z-0" />

                        {/* Chip & Logo */}
                        <div className="relative z-10 flex justify-between items-start mb-12">
                            <div
                                className="w-12 h-9 rounded-md shadow-lg flex items-center justify-center relative overflow-hidden"
                                style={{
                                    background: `linear-gradient(to right, ${tierColor} 0%, ${tierColor}80 100%)`,
                                    border: `1px solid ${tierColor}`
                                }}
                            >
                                <div className="absolute inset-0 border border-black/20 rounded-md" />
                                <div className="w-full h-[1px] bg-black/20 absolute top-1/3" />
                                <div className="w-full h-[1px] bg-black/20 absolute bottom-1/3" />
                                <div className="h-full w-[1px] bg-black/20 absolute left-1/3" />
                                <div className="h-full w-[1px] bg-black/20 absolute right-1/3" />
                            </div>
                            <div className="flex items-center gap-3 opacity-90">
                                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#0a0a0f] border border-white/10 shadow-sm" style={{ color: tierColor }}>
                                    {tierName.toUpperCase().includes("MIEMBRO") ? tierName : `MIEMBRO ${tierName}`}
                                </span>
                                <CreditCard className="w-5 h-5 text-white/50" />
                            </div>
                        </div>

                        {/* Card Number & Details */}
                        <div className="relative z-10 text-white">
                            <div className="font-mono text-xl tracking-[0.2em] mb-4 text-shadow-sm flex gap-4 text-white/90">
                                <span>****</span>
                                <span>****</span>
                                <span>{customer.magicToken?.slice(0, 4) || "0000"}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] text-gray-400 uppercase mb-1 font-medium">Titular</div>
                                    <div className="font-medium tracking-wide text-lg">{customer.firstName || "Miembro VIP"}</div>
                                    <div className="text-[11px] text-gray-400/80 mt-0.5 font-medium">
                                        {program?.pointsPercentage
                                            ? `${customer.currentPoints || 0} Puntos`
                                            : `${customer.visits?.length || customer.totalVisits || 0} Visitas`
                                        }
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-gray-400 uppercase mb-1">Tu Calificación</div>
                                    <div className="font-bold text-xl flex items-center justify-end gap-1.5">
                                        <span>{customer.averageRating ? Number(customer.averageRating).toFixed(1) : "5.0"}</span>
                                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Injection (Promotions) */}
                    {children}

                    <div className="text-sm text-gray-400 px-2 font-medium">Tus Recompensas</div>

                    <div className="space-y-4">
                        {displayedRewards.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm italic">
                                No hay recompensas disponibles.
                            </div>
                        )}
                        {displayedRewards.map((reward: any) => {
                            const isPointsBased = reward.costInPoints > 0
                            const currentMetric = isPointsBased ? (customer.currentPoints || 0) : currentVisits
                            const targetMetric = isPointsBased ? reward.costInPoints : reward.costInVisits

                            const isUnlocked = currentMetric >= targetMetric
                            const pendingRedemption = pendingRedemptions.find((r: any) => r.rewardId === reward.id)
                            const isPending = !!pendingRedemption
                            const progress = Math.min(100, (currentMetric / targetMetric) * 100)

                            return (
                                <div key={reward.id} className="relative group">
                                    <div className={cn(
                                        "relative overflow-hidden rounded-2xl p-5 border transition-all duration-300",
                                        isUnlocked || isPending
                                            ? "bg-gradient-to-r from-pink-500/20 to-purple-600/20 border-pink-500/50 shadow-[0_0_30px_-10px_rgba(236,72,153,0.3)]"
                                            : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}>
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-8 rounded-md flex items-center justify-center",
                                                    isUnlocked || isPending ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg" : "bg-white/10 text-gray-500"
                                                )}>
                                                    {isUnlocked || isPending ? <Gift className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-lg">{reward.name}</div>
                                                    <div className="text-xs text-gray-400">
                                                        {isPointsBased
                                                            ? `${reward.costInPoints} Puntos requeridos`
                                                            : `${reward.costInVisits} visitas requeridas`
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Indicator */}
                                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-1000", isUnlocked || isPending ? "bg-gradient-to-r from-pink-500 to-purple-500" : "bg-gray-600")}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>

                                        {/* ACTIONS */}
                                        {isPending ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedReward(pendingRedemption)
                                                    setShowQr(true)
                                                }}
                                                className="absolute right-4 bottom-4 px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-1"
                                            >
                                                <QRCodeSVG value="icon" size={14} /> Ver Código
                                            </button>
                                        ) : isUnlocked ? (
                                            <button
                                                onClick={() => handleUnlock(reward.id)}
                                                className="absolute right-4 bottom-4 px-4 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold rounded-full hover:scale-105 transition-transform"
                                            >
                                                Canjear Puntos
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Action Button - Now ABSOLUTE inside the container */}
            <div className="absolute bottom-6 left-6 right-6 z-20">
                <button
                    onClick={() => setShowQr(true)}
                    className="w-full bg-gradient-to-r from-orange-400 to-pink-500 py-4 rounded-full font-bold text-white shadow-2xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <QRCodeSVG value="icon" size={20} className="hidden" />
                    <Sparkles className="w-5 h-5" /> MOSTRAR CÓDIGO
                </button>
            </div>

            {/* QR FULLSCREEN MODAL */}
            {showQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200" onClick={() => { setShowQr(false); setTimeout(() => setSelectedReward(null), 300); }}>
                    <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-[32px] p-8 text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 to-pink-500" />

                        <h3 className="text-2xl font-bold text-white mb-2">
                            {selectedReward ? "Canjear Premio" : "Tu Código QR"}
                        </h3>
                        <p className="text-gray-400 text-sm mb-8">
                            {selectedReward ? "Muestra este código al mesero para recibir tu premio." : "Muestra este código para sumar visitas."}
                        </p>

                        <div className="bg-white p-4 rounded-2xl inline-block shadow-2xl mb-8">
                            {/* Prefix 'R:' for Reward Redemption, 'V:' for Visit Log */}
                            <QRCodeSVG
                                value={selectedReward ? `R:${selectedReward.redemptionCode}` : `V:${customer.magicToken}`}
                                size={200}
                            />
                        </div>

                        {selectedReward && (
                            <div className="mb-6 font-mono text-xl tracking-widest text-pink-500 font-bold">
                                {selectedReward.redemptionCode}
                            </div>
                        )}

                        <div className="flex gap-2 justify-center">
                            <button onClick={() => { setShowQr(false); setTimeout(() => setSelectedReward(null), 300); }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

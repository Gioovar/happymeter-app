"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { QRCodeSVG } from "qrcode.react"
import { unlockReward, getMemberLoyaltyPrograms, getLoyaltyNotifications, markNotificationsAsRead } from "@/actions/loyalty"
import { toast } from "sonner"
import { Star, Gift, Check, Lock, ChevronRight, Menu, CreditCard, Sparkles, Copy, X, User, LogOut, Wallet, Calendar, Bell, QrCode } from "lucide-react"
import { InstallPwa } from "@/components/pwa/InstallPwa"
import { cn } from "@/lib/utils"
import { useClerk, useUser } from "@clerk/nextjs"
import Link from "next/link"

interface CustomerLoyaltyCardProps {
    customer: any // Prisma type with relations
    filterType?: "all" | "visits" | "points"
    children?: React.ReactNode
    className?: string
    onEditProfile?: () => void
}

export function CustomerLoyaltyCard({ customer, filterType = "all", children, className, onEditProfile }: CustomerLoyaltyCardProps) {
    const { user } = useUser()
    const { signOut, openUserProfile } = useClerk()
    const { program, visits, currentVisits } = customer
    const [selectedReward, setSelectedReward] = useState<any | null>(null)
    const [showQr, setShowQr] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [myCards, setMyCards] = useState<any[]>([])
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [showNotifications, setShowNotifications] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Load notifications on mount
    useEffect(() => {
        if (customer?.id && customer?.programId) {
            getLoyaltyNotifications(customer.programId, customer.id).then(res => {
                if (res.success && res.notifications) {
                    console.log("Notifications loaded:", res.notifications.length)
                    setNotifications(res.notifications)
                    setUnreadCount(res.unreadCount || 0)
                } else {
                    console.error("Failed to load notifications:", res.error)
                }
            })
        }
    }, [customer])

    const handleOpenNotifications = async () => {
        setShowNotifications(true)
        if (unreadCount > 0) {
            await markNotificationsAsRead(customer.id)
            setUnreadCount(0)
        }
    }

    // Load other cards when menu opens
    useEffect(() => {
        if (showMenu && customer.clerkUserId) {
            getMemberLoyaltyPrograms(customer.clerkUserId).then(res => {
                if (res.success) {
                    setMyCards(res.memberships || [])
                }
            })
        }
    }, [showMenu, customer.clerkUserId])

    // Find current unlocked rewards (pending redemption)
    const pendingRedemptions = customer.redemptions ? customer.redemptions.filter((r: any) => r.status === 'PENDING') : []

    const handleUnlock = async (rewardId: string) => {
        if (customer.currentPoints < 0 && customer.currentVisits < 0) return // Basic check

        // Optimistic UI could go here
        const res = await unlockReward(customer.id, rewardId)
        if (res.success) {
            toast.success("¡Premio desbloqueado! Muestra el código al personal.")
            window.location.reload()
        } else {
            toast.error(res.error || "No tienes suficientes visitas/puntos")
        }
    }

    // Filter rewards based on filterType and Active status
    const displayedRewards = program?.rewards?.filter((reward: any) => {
        if (!reward.isActive) return false // Hide inactive

        // Hide SYSTEM_GIFT unless user has it pending (or redeemed? redeemed means it's gone or in history)
        // Check if user has a pending redemption for this reward
        if (reward.description === "SYSTEM_GIFT") {
            const hasPending = pendingRedemptions.some((r: any) => r.rewardId === reward.id)
            if (!hasPending) return false
        }

        if (filterType === "visits") return reward.costInVisits > 0
        if (filterType === "points") return reward.costInPoints > 0
        return true
    }).sort((a: any, b: any) => {
        // Sort by cost (Visits or Points)
        const costA = a.costInVisits || a.costInPoints || 0
        const costB = b.costInVisits || b.costInPoints || 0
        return costA - costB
    }).sort((a: any, b: any) => {
        // SYSTEM_GIFT always first
        if (a.description === "SYSTEM_GIFT") return -1
        if (b.description === "SYSTEM_GIFT") return 1
        return 0
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
                    <div className="flex items-center gap-3">
                        {program?.logoUrl ? (
                            <img src={program.logoUrl} alt={program.businessName} className="w-10 h-10 object-contain rounded-full bg-white/10 p-1" />
                        ) : null}
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">{program?.businessName || "Mi Negocio"}</h1>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">Membresía Digital</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleOpenNotifications}
                            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors relative mr-2"
                        >
                            <Bell className="w-5 h-5 text-gray-300" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold border border-black">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setShowMenu(true)}
                            className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <Menu className="w-5 h-5 text-gray-300" />
                        </button>
                    </div>
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

                        {/* QR Hint Button (New) */}
                        <div className="absolute top-6 right-6 z-20">
                            <div className="p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-colors shadow-lg">
                                <QrCode className="w-5 h-5 text-white" />
                            </div>
                        </div>

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
                            <div className="flex items-center gap-3 opacity-90 pr-12">
                                <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#0a0a0f] border border-white/10 shadow-sm" style={{ color: tierColor }}>
                                    {tierName.toUpperCase().includes("MIEMBRO") ? tierName : `MIEMBRO ${tierName}`}
                                </span>
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
                                    <div className="font-medium tracking-wide text-lg capitalize">{customer.name || "Miembro"}</div>
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

                    {/* QR Code Popover (Portal) */}
                    {showQr && mounted && createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowQr(false)}>
                            <div className="bg-white p-6 rounded-3xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                <div className="mb-4 text-center">
                                    <h3 className="text-black font-bold text-lg">Tu Código de Miembro</h3>
                                    <p className="text-gray-500 text-xs">Muestra esto al personal para registrar tu visita</p>
                                </div>
                                <div className="bg-white p-2 rounded-xl border-2 border-dashed border-gray-200">
                                    <QRCodeSVG
                                        value={`https://happymeters.com/admin/scan/${customer.magicToken}`}
                                        size={200}
                                        level="H"
                                        includeMargin={true}
                                        className="w-full h-auto"
                                    />
                                </div>
                                <p className="mt-4 text-center font-mono text-sm font-bold text-gray-900 tracking-widest">{customer.magicToken}</p>
                            </div>
                        </div>,
                        document.body
                    )}


                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => window.location.href = `/book/${program.id}`}
                            className="bg-[#1a1a24] hover:bg-[#20202b] text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98] border border-white/5"
                        >
                            <Calendar className="w-6 h-6 text-violet-400" />
                            <span className="text-sm font-bold">Reservar</span>
                        </button>

                        <button
                            onClick={() => toast.info("Próximamente: Menú Digital", {
                                description: "Pronto podrás ver el menú completo aquí."
                            })}
                            className="bg-[#1a1a24] hover:bg-[#20202b] text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.98] border border-white/5"
                        >
                            <div className="w-6 h-6 rounded-md border-2 border-dashed border-gray-500 flex items-center justify-center">
                                <span className="text-[10px] font-bold">M</span>
                            </div>
                            <span className="text-sm font-bold">Menú</span>
                        </button>
                    </div>

                    {/* Content Injection (Promotions) */}
                    {children ? children : (
                        <div className="space-y-4 mb-6">
                            {program?.promotions?.map((promo: any) => (
                                <div key={promo.id} className="relative overflow-hidden rounded-2xl aspect-[2/1] bg-gray-800 shadow-lg group">
                                    <img src={promo.imageUrl} alt={promo.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 p-4 w-full">
                                        <h3 className="text-white font-bold text-lg mb-1">{promo.title || "Promoción"}</h3>
                                        <p className="text-gray-300 text-xs line-clamp-2">{promo.description}</p>
                                    </div>
                                    {promo.terms && (
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md">
                                            <p className="text-[10px] text-gray-300 font-medium">{promo.terms}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="text-sm text-gray-400 px-2 font-medium">Tus Recompensas</div>

                    <div className="space-y-4">
                        {displayedRewards.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-sm italic">
                                No hay recompensas disponibles.
                            </div>
                        )}
                        {displayedRewards.map((reward: any) => {
                            // Check if locked
                            let isLocked = true
                            let progress = 0
                            let requirementText = ""

                            if (reward.costInVisits > 0) {
                                isLocked = (customer.currentVisits || 0) < reward.costInVisits
                                progress = Math.min(100, ((customer.currentVisits || 0) / reward.costInVisits) * 100)
                                requirementText = `${reward.costInVisits} visitas requeridas`
                            } else if (reward.costInPoints > 0) {
                                isLocked = (customer.currentPoints || 0) < reward.costInPoints
                                progress = Math.min(100, ((customer.currentPoints || 0) / reward.costInPoints) * 100)
                                requirementText = `${reward.costInPoints} Puntos requeridos`
                            }

                            // Check pending redemption
                            const pending = pendingRedemptions.find((r: any) => r.rewardId === reward.id)
                            const isSystemGift = reward.description === "SYSTEM_GIFT"

                            return (
                                <div
                                    key={reward.id}
                                    onClick={() => !isLocked && !pending && handleUnlock(reward.id)}
                                    className={cn(
                                        "relative overflow-hidden rounded-2xl border bg-[#12121a] p-4 transition-all duration-300",
                                        isSystemGift ? "border-purple-500/50 hover:border-purple-400 bg-purple-900/10" : "border-white/5",
                                        isLocked ? "opacity-70" : "cursor-pointer active:scale-[0.98]",
                                        !isSystemGift && !isLocked && "hover:border-violet-500/30 hover:bg-[#1a1a24]",
                                        pending ? "border-yellow-500/50 bg-yellow-900/10" : ""
                                    )}
                                >
                                    {isSystemGift && !isLocked && !pending && (
                                        <div className="absolute top-0 right-0 p-1.5 rounded-bl-xl bg-purple-500 text-white shadow-lg shadow-purple-500/20">
                                            <Sparkles className="w-3 h-3" />
                                        </div>
                                    )}

                                    <div className="flex gap-4 items-center relative z-10">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                            isLocked ? "bg-white/5 text-gray-500" :
                                                pending ? "bg-yellow-500/20 text-yellow-500" :
                                                    isSystemGift ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_-5px_#a855f7]" :
                                                        "bg-violet-500/20 text-violet-400"
                                        )}>
                                            {pending ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Gift className={cn("w-6 h-6", isSystemGift && "animate-pulse")} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className={cn("font-bold truncate pr-2",
                                                    pending ? "text-yellow-500" :
                                                        isSystemGift ? "text-white text-lg" : "text-white"
                                                )}>
                                                    {reward.name}
                                                </h3>
                                                {isLocked && <Lock className="w-4 h-4 text-gray-500 shrink-0 mt-1" />}
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">
                                                {isSystemGift ? "¡Tu regalo de bienvenida!" : requirementText}
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full transition-all duration-500",
                                                        pending ? "bg-yellow-500" :
                                                            isSystemGift ? "bg-gradient-to-r from-purple-500 to-pink-500" :
                                                                "bg-violet-500"
                                                    )}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {pending && (
                                        <div className="mt-3 bg-yellow-500/10 rounded-lg p-2 flex items-center gap-2 justify-center border border-yellow-500/20">
                                            <Sparkles className="w-4 h-4 text-yellow-500" />
                                            <span className="text-xs font-bold text-yellow-500 uppercase tracking-wide">Código de canje generado</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* FLOATING QR BUTTON (Bottom) */}
            <div className="absolute bottom-6 left-0 right-0 z-30 px-6 flex justify-center pointer-events-none">
                <button
                    onClick={() => setShowQr(true)}
                    className="pointer-events-auto bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform active:scale-95 border-2 border-white/20 text-sm tracking-wide"
                >
                    <QrCode className="w-5 h-5" />
                    MOSTRAR MI CÓDIGO
                </button>
            </div>

            {/* Notifications Modal (Portal) */}
            {showNotifications && mounted && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />
                    <div className="relative w-full max-w-md bg-[#18181b] border-t border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col m-auto sm:m-0 bottom-0 sm:bottom-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                <Bell className="w-5 h-5 text-violet-400" />
                                Notificaciones
                            </h2>
                            <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-white/10 rounded-full text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/20">
                            {notifications.length === 0 ? (
                                <div className="text-center py-10 text-gray-500">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No tienes notificaciones nuevas.</p>
                                </div>
                            ) : (
                                notifications.map((note) => (
                                    <div key={note.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-white text-sm">{note.title}</h4>
                                            <span className="text-[10px] text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 leading-relaxed">{note.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* SIDEBAR MENU */}
            {
                showMenu && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-300"
                            onClick={() => setShowMenu(false)}
                        />

                        {/* Side Menu (Wallet) */}
                        <div className="fixed inset-y-0 right-0 w-72 bg-[#111115] border-l border-white/10 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                            {/* Header */}
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#16161e]">
                                <div className="flex items-center gap-3">
                                    {user?.imageUrl ? (
                                        <img src={user.imageUrl} alt="User" className="w-10 h-10 rounded-full border border-white/10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center">
                                            <span className="font-bold text-white">{customer.name?.charAt(0) || "U"}</span>
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-bold text-sm truncate max-w-[120px]">{customer.name || "Usuario"}</div>
                                        <div className="text-xs text-gray-400">Miembro</div>
                                    </div>
                                </div>
                                <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                                {/* PWA Install (New) */}
                                <InstallPwa />

                                {/* Profile Actions */}
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 mb-2">Mi Cuenta</div>
                                    <button
                                        onClick={() => onEditProfile ? onEditProfile() : openUserProfile()}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="text-sm font-medium text-gray-300 group-hover:text-white">Perfil & Datos</div>
                                    </button>
                                </div>

                                {/* Wallet / Other Cards */}
                                <div className="space-y-2">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2 mb-2 flex justify-between items-center">
                                        <span>Mis Tarjetas</span>
                                        <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">{myCards.length}</span>
                                    </div>

                                    <div className="space-y-2">
                                        {myCards.length > 0 ? myCards.map((membership: any) => (
                                            <Link
                                                key={membership.program.id}
                                                href={`/loyalty/${membership.program.id}`}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5",
                                                    membership.program.id === program.id ? "bg-white/5 border-white/10" : ""
                                                )}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-black/50 p-1 flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                                                    {membership.program.logoUrl ? (
                                                        <img src={membership.program.logoUrl} alt={membership.program.businessName} className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        <CreditCard className="w-4 h-4 text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-gray-200 truncate">{membership.program.businessName}</div>
                                                    <div className="text-[10px] text-gray-500 truncate">Ver tarjeta</div>
                                                </div>
                                                {membership.program.id === program.id && (
                                                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                                                )}
                                            </Link>
                                        )) : (
                                            <div className="text-center py-6 px-4 border border-dashed border-white/10 rounded-xl">
                                                <Wallet className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                                <p className="text-xs text-gray-500">No tienes otras tarjetas guardadas aún.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/5 bg-[#16161e]">
                                <button
                                    onClick={() => signOut({ redirectUrl: `/loyalty/${program.id}` })}
                                    className="w-full flex items-center gap-2 justify-center p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-sm font-bold"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </>
                )
            }
        </div >
    )
}

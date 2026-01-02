"use client"

import { useState, useEffect } from "react"
import { CustomerLoyaltyCard } from "@/components/loyalty/CustomerLoyaltyCard"
import { syncClerkLoyaltyCustomer, updateLoyaltyProfile, getCustomerStatus } from "@/actions/loyalty"
import { toast } from "sonner"
import { Phone, ArrowRight, Loader2, Sparkles, User, Calendar, KeyRound } from "lucide-react"
import { SignIn, SignUp, useUser, SignedIn, SignedOut } from "@clerk/nextjs"

export default function CustomerLoyaltyPage({ params }: { params: { programId: string } }) {
    const { user, isLoaded: isClerkLoaded } = useUser()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customer, setCustomer] = useState<any>(null)
    const [showProfileForm, setShowProfileForm] = useState(false)

    // Profile Data
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [birthday, setBirthday] = useState("")

    useEffect(() => {
        if (!isClerkLoaded) return

        if (user) {
            handleSync()
        } else {
            setIsLoading(false)
        }
    }, [isClerkLoaded, user, params.programId])

    const handleSync = async () => {
        setIsLoading(true)
        const res = await syncClerkLoyaltyCustomer(params.programId)
        if (res.success && res.customer) {
            setCustomer(res.customer)

            // Should we ask for profile?
            if (!res.customer.birthday || !res.customer.name) {
                setName(res.customer.name || user?.firstName || "")
                setShowProfileForm(true)
            }
        } else {
            if (res.error) toast.error(res.error)
        }
        setIsLoading(false)
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return toast.error("Nombre requerido")

        setIsSubmitting(true)
        const res = await updateLoyaltyProfile(params.programId, customer.magicToken, {
            name,
            username: username || name,
            birthday: birthday ? new Date(birthday) : undefined
        })
        setIsSubmitting(false)

        if (res.success) {
            toast.success("¡Perfil actualizado!")
            setCustomer(res.customer)
            setShowProfileForm(false)
        } else {
            toast.error(res.error)
        }
    }

    if (!isClerkLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <SignedOut>
                <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none" />
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 mb-6">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Programa Rewards</h1>
                            <p className="text-gray-400">Inicia sesión para ver tus puntos</p>
                        </div>

                        <div className="w-full bg-white rounded-2xl overflow-hidden shadow-2xl">
                            <SignIn
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        card: "w-full shadow-none border-none",
                                        headerTitle: "hidden",
                                        headerSubtitle: "hidden",
                                        socialButtonsBlockButton: "text-black border-gray-200 hover:bg-gray-50",
                                        formButtonPrimary: "bg-violet-600 hover:bg-violet-700",
                                        footerActionLink: "text-violet-600 hover:text-violet-700"
                                    }
                                }}
                                redirectUrl={`/loyalty/${params.programId}`}
                            />
                        </div>
                    </div>
                </div>
            </SignedOut>

            <SignedIn>
                {isLoading ? (
                    <div className="min-h-screen flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    </div>
                ) : showProfileForm ? (
                    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
                        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                            <h1 className="text-2xl font-bold mb-6 text-center">Completa tu perfil 🎁</h1>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre Completo</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Ej. Juan Pérez"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Usuario (Opcional)</label>
                                        <div className="relative group">
                                            <span className="absolute left-4 top-4 text-gray-500 font-bold group-focus-within:text-violet-400 transition-colors">@</span>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                                placeholder="juanperez"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Cumpleaños</label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                            <input
                                                type="date"
                                                value={birthday}
                                                onChange={e => setBirthday(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium min-h-[58px]"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={!name || isSubmitting}
                                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Ver Tarjeta"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : (
                    customer && <CustomerLoyaltyCard customer={customer} className="min-h-screen" />
                )}
            </SignedIn>
        </div>
    )
}

"use client"

import { useState, useEffect } from "react"
import { CustomerLoyaltyCard } from "@/components/loyalty/CustomerLoyaltyCard"
import { syncClerkLoyaltyCustomer, updateLoyaltyProfile, getCustomerStatus, getPublicLoyaltyProgramInfo } from "@/actions/loyalty"
import { toast } from "sonner"
import { Phone, ArrowRight, Loader2, Sparkles, User, Calendar, KeyRound } from "lucide-react"
import { SignIn, SignUp, useUser, SignedIn, SignedOut, useClerk } from "@clerk/nextjs"
import { esES } from "@clerk/localizations"

export default function CustomerLoyaltyPage({ params }: { params: { programId: string } }) {
    const { user, isLoaded: isClerkLoaded } = useUser()
    const { openUserProfile, signOut } = useClerk()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [customer, setCustomer] = useState<any>(null)
    const [programInfo, setProgramInfo] = useState<any>(null)
    const [showProfileForm, setShowProfileForm] = useState(false)
    const [missingPhone, setMissingPhone] = useState(false)

    // Profile Data
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [birthday, setBirthday] = useState("")

    useEffect(() => {
        // Load Public Program Info immediately
        getPublicLoyaltyProgramInfo(params.programId).then(info => {
            if (info) setProgramInfo(info)
        })
    }, [params.programId])

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
        setMissingPhone(false) // Reset
        const res = await syncClerkLoyaltyCustomer(params.programId)
        if (res.success && res.customer) {
            setCustomer(res.customer)

            // Should we ask for profile?
            if (!res.customer.birthday || !res.customer.name) {
                setName(res.customer.name || user?.firstName || "")
                setShowProfileForm(true)
            }
        } else {
            if (res.error?.includes("número de celular")) {
                setMissingPhone(true)
            } else if (res.error) {
                toast.error(res.error)
            }
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

    if (missingPhone) {
        return (
            <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-sm bg-gray-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl">
                    <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Phone className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-3">Falta tu celular</h2>
                    <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                        Para acumular puntos en <strong>{programInfo?.businessName || "este negocio"}</strong>, necesitamos vincular un número de teléfono a tu perfil.
                    </p>

                    <button
                        onClick={() => openUserProfile()}
                        className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors mb-3 flex items-center justify-center gap-2"
                    >
                        Agrega tu Celular
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-transparent border border-white/10 text-white font-medium py-3.5 rounded-xl hover:bg-white/5 transition-colors mb-6"
                    >
                        Ya lo agregué
                    </button>

                    <button
                        onClick={() => signOut({ redirectUrl: `/loyalty/${params.programId}` })}
                        className="text-xs text-gray-500 hover:text-gray-300 underline"
                    >
                        Cerrar sesión e intentar con otra cuenta
                    </button>
                </div>
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
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 mb-6 overflow-hidden">
                                {programInfo?.logoUrl ? (
                                    <img src={programInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Sparkles className="w-8 h-8 text-white" />
                                )}
                            </div>
                            <h1 className="text-3xl font-bold mb-2">{programInfo?.businessName || "Programa Rewards"}</h1>
                            <p className="text-gray-400">Regístrate para ver tus puntos y recompensas</p>
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
                                forceRedirectUrl={`/loyalty/${params.programId}`}
                                signUpForceRedirectUrl={`/loyalty/${params.programId}`}
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
                                            <Calendar className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors pointer-events-none" />
                                            <input
                                                type="date"
                                                value={birthday}
                                                onChange={e => setBirthday(e.target.value)}
                                                style={{ colorScheme: 'dark' }}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 h-[58px] text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium appearance-none text-left"
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

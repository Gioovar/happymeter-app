"use client"

import { InstallPwa } from "@/components/pwa/InstallPwa"
import { useState, useEffect } from "react"
import { CustomerLoyaltyCard } from "@/components/loyalty/CustomerLoyaltyCard"
import { updateLoyaltyProfile, getPublicLoyaltyProgramInfo, getLoyaltySession } from "@/actions/loyalty"
import { LoyaltyAuthForm } from "@/components/loyalty/LoyaltyAuthForm"
import { claimWelcomeGift } from "@/actions/loyalty"
import { PromotionsSlider } from "@/components/loyalty/PromotionsSlider"
import { toast } from "sonner"
import { Loader2, Sparkles, User, Calendar } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoyaltyContent({ params }: { params: { programId: string } }) {
    const [isLoading, setIsLoading] = useState(true)
    const [customer, setCustomer] = useState<any>(null)
    const [programInfo, setProgramInfo] = useState<any>(null)
    const [showProfileForm, setShowProfileForm] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Profile Data
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [username, setUsername] = useState("")
    const [birthday, setBirthday] = useState("")

    // PWA
    const [showInstallPrompt, setShowInstallPrompt] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()
    const claimGift = searchParams.get("claim_gift")

    // 1. Initial Load
    useEffect(() => {
        const load = async () => {
            try {
                // Resolve Program ID from Slug (if needed)
                // We fetch public info which now handles the resolution
                const info = await getPublicLoyaltyProgramInfo(params.programId)

                if (info) {
                    setProgramInfo(info)

                    // Now check session with the REAL ID
                    const sessionCustomer = await getLoyaltySession()
                    if (sessionCustomer) {
                        if (sessionCustomer.programId === info.id) {
                            setCustomer(sessionCustomer)
                        } else {
                            console.log("Session mismatch")
                        }
                    }
                } else {
                    toast.error("Programa no encontrado")
                }
            } catch (e) {
                console.error(e)
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [params.programId])

    // 2. Claim Gift Effect
    useEffect(() => {
        if (claimGift && customer) {
            claimWelcomeGift(params.programId, customer.id).then(res => {
                if (res.success) {
                    toast.success("¡Regalo de Bienvenida añadido!", {
                        description: "Lo encontrarás al inicio de tu lista de premios.",
                        icon: <Sparkles className="w-5 h-5 text-purple-400" />
                    })
                    const newParams = new URLSearchParams(searchParams.toString())
                    newParams.delete("claim_gift")
                    router.replace(`/loyalty/${params.programId}`)
                    // Refresh data
                    getLoyaltySession().then(c => c && setCustomer(c))
                } else {
                    if (!res.error?.includes("Ya tienes")) {
                        toast.error(res.error)
                    }
                }
            })
        }
    }, [claimGift, customer, params.programId, router, searchParams])


    // 3. Auto-Open Profile Form if 'action=signup' ONLY if missing data
    useEffect(() => {
        if (customer && searchParams.get("action") === 'signup') {
            const isProfileComplete =
                customer.name &&
                customer.email &&
                customer.phone &&
                customer.birthday

            if (isProfileComplete) {
                // If complete, remove param and don't show form
                const newParams = new URLSearchParams(searchParams.toString())
                newParams.delete("action")
                router.replace(`/loyalty/${params.programId}?${newParams.toString()}`)
            } else {
                // Pre-fill and show form
                if (!showProfileForm) {
                    setName(customer.name || searchParams.get("name") || "")
                    setEmail(customer.email || searchParams.get("email") || "")
                    setPhone(customer.phone || searchParams.get("phone") || "")
                    setUsername(customer.username || "")
                    if (customer.birthday) {
                        setBirthday(new Date(customer.birthday).toISOString().split('T')[0])
                    }
                    setShowProfileForm(true)
                }
            }
        }
    }, [customer, searchParams, showProfileForm, params.programId, router])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation: All fields required
        if (!name || !email || !phone || !birthday) {
            return toast.error("Por favor completa todos los campos")
        }

        setIsSubmitting(true)
        const res = await updateLoyaltyProfile(params.programId, customer.magicToken, {
            name,
            email,
            phone,
            username: username || name,
            birthday: birthday ? new Date(birthday) : undefined
        })
        setIsSubmitting(false)

        if (res.success) {
            toast.success("¡Perfil actualizado!")
            setCustomer(res.customer)
            setShowProfileForm(false)

            // Remove 'action=signup' from URL
            const newParams = new URLSearchParams(searchParams.toString())
            newParams.delete("action")
            // Also delete pre-fill params
            newParams.delete("name")
            newParams.delete("email")
            newParams.delete("phone")

            router.replace(`/loyalty/${params.programId}?${newParams.toString()}`)

            setTimeout(() => setShowInstallPrompt(true), 1500)
        } else {
            toast.error(res.error)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        )
    }

    if (!customer) {
        return (
            <LoyaltyAuthForm
                programId={programInfo?.id || params.programId}
                businessName={programInfo?.businessName || "Programa Rewards"}
                logoUrl={programInfo?.logoUrl}
                initialData={{
                    name: searchParams.get("name") || undefined,
                    phone: searchParams.get("phone") || undefined,
                    email: searchParams.get("email") || undefined
                }}
                onSuccess={(newCustomer) => {
                    setCustomer(newCustomer)
                    // If just joined, maybe trigger PWA prompt
                    setTimeout(() => setShowInstallPrompt(true), 2000)
                }}
            />
        )
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <InstallPwa mode="modal" isOpen={showInstallPrompt} onClose={() => setShowInstallPrompt(false)} />

            {showProfileForm ? (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
                    <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                        <h1 className="text-2xl font-bold mb-6 text-center">Completa tu perfil 🎁</h1>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nombre Completo <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Ej. Juan Pérez"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Tu Celular <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="55 1234 5678"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Correo Electrónico <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium"
                                        required
                                    />
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
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Cumpleaños <span className="text-red-500">*</span></label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors pointer-events-none" />
                                        <input
                                            type="date"
                                            value={birthday}
                                            onChange={e => setBirthday(e.target.value)}
                                            style={{ colorScheme: 'dark' }}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 h-[58px] text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium appearance-none text-left"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowProfileForm(false)}
                                        className="flex-1 bg-transparent border border-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/5 disabled:opacity-50"
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!name || !email || !phone || !birthday || isSubmitting}
                                        className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : "Guardar"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div >
            ) : (
                <CustomerLoyaltyCard
                    customer={customer}
                    filterType={(searchParams.get("mode")?.toLowerCase() as "visits" | "points") || "all"}
                    className="min-h-screen"
                    onEditProfile={() => {
                        setName(customer.name || "")
                        setEmail(customer.email || "")
                        setPhone(customer.phone || "")
                        setUsername(customer.username || "")
                        if (customer.birthday) {
                            const d = new Date(customer.birthday)
                            setBirthday(d.toISOString().split('T')[0])
                        } else {
                            setBirthday("")
                        }
                        setShowProfileForm(true)
                    }}
                >
                    {customer.program?.promotions && customer.program.promotions.length > 0 && (
                        <div className="mt-2 text-sm font-bold text-gray-500 uppercase tracking-wider px-1 mb-2">
                            Promociones
                        </div>
                    )}
                    <PromotionsSlider promotions={customer.program?.promotions || []} />
                </CustomerLoyaltyCard>
            )
            }
        </div >
    )
}

export default function CustomerLoyaltyPage({ params }: { params: { programId: string } }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        }>
            <LoyaltyContent params={params} />
        </Suspense>
    )
}

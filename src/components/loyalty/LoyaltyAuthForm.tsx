"use client"

import { useState } from "react"
import { authenticateLoyaltyCustomer } from "@/actions/loyalty"
import { toast } from "sonner"
import { Phone, User, ArrowRight, Loader2, Sparkles } from "lucide-react"

interface LoyaltyAuthFormProps {
    programId: string
    businessName: string
    logoUrl?: string | null
    onSuccess: (customer: any) => void
}

export function LoyaltyAuthForm({ programId, businessName, logoUrl, onSuccess }: LoyaltyAuthFormProps) {
    const [step, setStep] = useState<'PHONE' | 'NAME'>('PHONE')
    const [phone, setPhone] = useState("")
    const [name, setName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmitPhone = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone || phone.length < 10) return toast.error("Ingresa un número válido")

        setIsLoading(true)
        // Attempt to auth. If user exists, it will succeed.
        // If user is new, we might strictly REQUIRE name, or allow "Guest".
        // For better UX, let's try to auth. If it's a new user, maybe we want to force name capture first?
        // Actually, let's just ask for Name immediately if it's not a known user?
        // BUT, we don't know if they are known without querying.
        // Strategy: Try to auth. If success, great. 
        // If we want to capture name for NEW users, we need to know if they are new.
        // Simplified flow: Just ask for both OR Ask Phone -> If new -> Ask Name.
        // Let's do: Phone -> Submit. 
        // Logic: The action `authenticateLoyaltyCustomer` allows creating without name.
        // We can check the result. If `customer.name` is missing, we show the Name form.

        try {
            const res = await authenticateLoyaltyCustomer(programId, phone)
            if (res.success && res.customer) {
                if (!res.customer.name) {
                    // User exists (or created) but has no name. Show Name step.
                    setStep('NAME')
                } else {
                    // Start success animation/callback
                    toast.success(`¡Hola de nuevo, ${res.customer.name}!`)
                    onSuccess(res.customer)
                }
            } else {
                toast.error(res.error || "Error al ingresar")
            }
        } catch (error) {
            toast.error("Error de conexión")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmitName = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return toast.error("Dinos cómo llamarte")

        setIsLoading(true)
        try {
            // Update the existing profile with the name
            const res = await authenticateLoyaltyCustomer(programId, phone, name)
            if (res.success) {
                toast.success("¡Bienvenido al club!")
                onSuccess(res.customer)
            } else {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error("Error al guardar nombre")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">

                {/* Header / Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-500/25 mb-6 overflow-hidden ring-4 ring-black/50">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <Sparkles className="w-10 h-10 text-white" />
                        )}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{businessName}</h1>
                    <p className="text-gray-400 font-medium">Programa de Recompensas</p>
                </div>

                {/* Card Container */}
                <div className="bg-[#111] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    {step === 'PHONE' ? (
                        <form onSubmit={handleSubmitPhone} className="relative z-10 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Tu Celular</label>
                                    <div className="relative group/input">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/input:text-indigo-400 transition-colors" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Ej. 6671234567"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-center text-gray-500 leading-relaxed px-4">
                                    Usamos tu número para guardar tus puntos y visitas de forma segura. Sin spam.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || phone.length < 5}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        <span>Continuar</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmitName} className="relative z-10 space-y-6 animate-in slide-in-from-right-8 duration-300">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-widest ml-1">Tu Nombre</label>
                                    <div className="relative group/input">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/input:text-indigo-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ej. Juan Pérez"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-center text-gray-500 leading-relaxed px-4">
                                    Para personalizar tu experiencia en <strong>{businessName}</strong>.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || !name}
                                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "¡Listo!"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer Link */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-600">
                        Powered by <span className="text-white font-bold">HappyMeter</span>
                    </p>
                </div>

            </div>
        </div>
    )
}

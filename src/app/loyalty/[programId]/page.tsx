"use client"

import { useState, useEffect } from "react"
import { CustomerLoyaltyCard } from "@/components/loyalty/CustomerLoyaltyCard"
import { sendLoyaltyOtp, verifyLoyaltyOtp, updateLoyaltyProfile, getCustomerStatus } from "@/actions/loyalty"
import { toast } from "sonner"
import { Phone, ArrowRight, Loader2, Sparkles, User, Calendar, KeyRound } from "lucide-react"

type Step = 'PHONE' | 'OTP' | 'PROFILE' | 'DASHBOARD'

export default function CustomerLoyaltyPage({ params }: { params: { programId: string } }) {
    const [step, setStep] = useState<Step>('PHONE')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Data
    const [phone, setPhone] = useState("")
    const [otp, setOtp] = useState("")
    const [devOtp, setDevOtp] = useState("") // For demo
    const [customer, setCustomer] = useState<any>(null)

    // Profile Data
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [birthday, setBirthday] = useState("")

    useEffect(() => {
        // Check local storage for magic token
        const storedToken = localStorage.getItem(`loyalty_token_${params.programId}`)
        if (storedToken) {
            loadCustomer(storedToken)
        } else {
            setIsLoading(false)
        }
    }, [params.programId])

    const loadCustomer = async (token: string) => {
        try {
            const data = await getCustomerStatus(params.programId, token)
            if (data) {
                setCustomer(data)
                setStep('DASHBOARD')
            } else {
                localStorage.removeItem(`loyalty_token_${params.programId}`)
                setStep('PHONE')
            }
        } catch (error) {
            console.error(error)
            setStep('PHONE')
        }
        setIsLoading(false)
    }

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (phone.length < 10) return toast.error("Número inválido")

        setIsSubmitting(true)
        const res = await sendLoyaltyOtp(params.programId, phone)
        setIsSubmitting(false)

        if (res.success) {
            setStep('OTP')
            if (res.devCode) {
                setDevOtp(res.devCode)
                toast.info(`Simulación: Tu código es ${res.devCode}`)
            }
        } else {
            toast.error(res.error)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length < 6) return toast.error("Código incompleto")

        setIsSubmitting(true)
        const res = await verifyLoyaltyOtp(params.programId, phone, otp)
        setIsSubmitting(false)

        if (res.success && res.customer) {
            // Save token
            if (res.customer.magicToken) {
                localStorage.setItem(`loyalty_token_${params.programId}`, res.customer.magicToken)
                setCustomer(res.customer)

                // Check if profile is complete (e.g. valid name)
                if (!res.customer.name || !res.customer.birthday) {
                    setStep('PROFILE')
                } else {
                    await loadCustomer(res.customer.magicToken)
                }
            }
        } else {
            toast.error(res.error)
        }
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return toast.error("Nombre requerido")

        setIsSubmitting(true)
        const res = await updateLoyaltyProfile(params.programId, customer.magicToken, {
            name,
            username: username || name, // Default username to name if empty
            birthday: birthday ? new Date(birthday) : undefined
        })
        setIsSubmitting(false)

        if (res.success) {
            toast.success("¡Registro completado!")
            await loadCustomer(customer.magicToken)
        } else {
            toast.error(res.error)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }

    if (step === 'DASHBOARD' && customer) {
        return <CustomerLoyaltyCard customer={customer} className="min-h-screen" />
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden text-white font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 mb-6">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Programa Rewards</h1>
                    <p className="text-gray-400">
                        {step === 'PHONE' && "Ingresa tu celular para comenzar"}
                        {step === 'OTP' && "Verifica tu número"}
                        {step === 'PROFILE' && "Completa tus datos"}
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">

                    {step === 'PHONE' && (
                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Celular</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123 456 7890"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium text-lg tracking-wide"
                                        maxLength={10}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={phone.length < 10 || isSubmitting}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Enviar Código"}
                            </button>
                        </form>
                    )}

                    {step === 'OTP' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="text-center mb-4">
                                <p className="text-sm text-gray-400">
                                    Enviamos un código al
                                    <span className="text-white font-medium ml-1">{phone}</span>
                                </p>
                                <button type="button" onClick={() => setStep('PHONE')} className="text-xs text-violet-400 hover:text-violet-300 mt-2">
                                    Cambiar número
                                </button>
                                {devOtp && (
                                    <div className="mt-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                                        <p className="text-xs text-violet-300">Código de prueba: <span className="font-mono font-bold text-lg block mt-1 tracking-widest">{devOtp}</span></p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Código de Verificación</label>
                                <div className="relative group">
                                    <KeyRound className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium text-lg tracking-[0.5em] text-center"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={otp.length < 6 || isSubmitting}
                                className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl hover:bg-violet-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Verificar"}
                            </button>
                        </form>
                    )}

                    {step === 'PROFILE' && (
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
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Cumpleaños (Para regalos)</label>
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
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Finalizar Registro"}
                            </button>
                        </form>
                    )}

                </div>

                <p className="text-center text-xs text-gray-600 mt-8">
                    HappyMeter Rewards © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}

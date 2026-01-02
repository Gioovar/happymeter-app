"use client"

import { useState, useEffect } from "react"
import { CustomerLoyaltyCard } from "@/components/loyalty/CustomerLoyaltyCard"
import { registerLoyaltyCustomer, getCustomerStatus } from "@/actions/loyalty"
import { toast } from "sonner"
import { Phone, ArrowRight, Loader2, Sparkles, Mail, User } from "lucide-react"

export default function CustomerLoyaltyPage({ params }: { params: { programId: string } }) {
    const [customer, setCustomer] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [isRegistering, setIsRegistering] = useState(false)

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
        const data = await getCustomerStatus(params.programId, token)
        if (data) {
            setCustomer(data)
        } else {
            // Token invalid
            localStorage.removeItem(`loyalty_token_${params.programId}`)
        }
        setIsLoading(false)
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (phone.length < 10) {
            toast.error("Ingresa un número celular válido")
            return
        }

        setIsRegistering(true)
        const res = await registerLoyaltyCustomer(params.programId, {
            phone,
            email: email || undefined
        })

        if (res.success && res.customer) { // Ensure customer exists
            // Save token
            if (res.customer.magicToken) { // Check specifically
                localStorage.setItem(`loyalty_token_${params.programId}`, res.customer.magicToken)
                await loadCustomer(res.customer.magicToken)
            } else {
                // Should not happen based on schema but for safety
                toast.error("Error de sistema: Token no generado")
            }
            toast.success("¡Bienvenido!")
        } else {
            toast.error("Error al ingresar")
        }
        setIsRegistering(false)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        )
    }

    if (customer) {
        return <CustomerLoyaltyCard customer={customer} />
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none" />
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-violet-900/10 to-transparent pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-violet-500/20 rotate-3 transition-transform hover:rotate-6">
                        <Sparkles className="w-12 h-12 text-white" />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-3">Programa Rewards</h1>
                    <p className="text-gray-400 text-lg max-w-xs mx-auto leading-relaxed">
                        Acumula puntos, sube de nivel y desbloquea recompensas exclusivas.
                    </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Celular</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} // Numbers only
                                        placeholder="Tu número (10 dígitos)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium text-lg"
                                        maxLength={10}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                                    Correo <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-gray-400 font-normal normal-case">Opcional</span>
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={phone.length < 10 || isRegistering}
                                className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {isRegistering ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Entrar al Programa</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <p className="text-center text-xs text-gray-600 mt-8">
                    HappyMeter Rewards © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}

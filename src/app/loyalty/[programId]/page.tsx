"use client"

import { useState, useEffect } from "react"
import { CustomerLoyaltyCard } from "@/components/loyalty/CustomerLoyaltyCard"
import { registerLoyaltyCustomer, getCustomerStatus } from "@/actions/loyalty"
import { toast } from "sonner"
import { Phone, ArrowRight, Loader2, PartyPopper } from "lucide-react"

export default function CustomerLoyaltyPage({ params }: { params: { programId: string } }) {
    const [customer, setCustomer] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [phone, setPhone] = useState("")
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
            toast.error("Ingresa un número válido")
            return
        }

        setIsRegistering(true)
        const res = await registerLoyaltyCustomer(params.programId, { phone })

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
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        )
    }

    if (customer) {
        return <CustomerLoyaltyCard customer={customer} />
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-sm text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PartyPopper className="w-10 h-10 text-purple-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Programa de Lealtad</h1>
                <p className="text-slate-500 mb-8">
                    Ingresa tu número celular para sumar visitas y ganar premios.
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} // Numbers only
                            placeholder="Tu número celular (10 dígitos)"
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-lg"
                            maxLength={10}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isRegistering || phone.length < 10}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isRegistering ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Ingresar <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-8 text-xs text-slate-400">
                    Al continuar aceptas recibir actualizaciones sobre tus recompensas.
                </p>
            </div>
        </div>
    )
}

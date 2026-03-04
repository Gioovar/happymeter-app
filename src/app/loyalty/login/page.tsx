'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Send, Smartphone, Sparkles, Loader2 } from 'lucide-react'
import { sendGlobalLoyaltyOtp } from '@/actions/loyalty-global'
import { toast } from 'sonner'
import { InstallPwa } from '@/components/pwa/InstallPwa'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectUrl = searchParams.get('redirect')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (phone.length < 10) return toast.error('Ingresa un número válido')

        setIsLoading(true)
        const res = await sendGlobalLoyaltyOtp(phone)
        setIsLoading(false)

        if (res.success) {
            toast.success("¡Bienvenido a tu Billetera!")
            // Direct back to program if scanning QR, else go to wallet
            router.push(redirectUrl || '/loyalty/wallet')
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <InstallPwa mode="modal" />

            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 shadow-inner border border-white/10">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">HappyMeters</h1>
                    <p className="text-gray-400">Tu Billetera Digital de Lealtad</p>
                </div>

                <div className="bg-[#111] border border-white/10 p-6 rounded-3xl shadow-2xl backdrop-blur-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Número de Celular</label>
                            <div className="relative group">
                                <Smartphone className="absolute left-4 top-4 w-5 h-5 text-gray-500 group-focus-within:text-violet-400 transition-colors" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Ej. 55 1234 5678"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all font-medium text-lg"
                                    autoFocus
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || phone.length < 10}
                            className="w-full bg-white text-black font-bold text-lg py-4 rounded-2xl hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Continuar <Send className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-xs text-center text-gray-600 mt-6">
                        Al continuar, aceptas nuestros Términos y Condiciones.
                    </p>
                </div>
            </motion.div>
        </div>
    )
}

export default function GlobalLoyaltyLogin() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <LoginContent />
        </Suspense>
    )
}


'use client'

import { completeOnboarding } from '@/actions/onboarding'
import { Store, Phone, Instagram, Facebook, CheckCircle2, MessageSquare, Loader2, MapPin } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [phone, setPhone] = useState('')

    // Verification State
    const [verificationStep, setVerificationStep] = useState<'IDLE' | 'SENDING' | 'SENT' | 'VERIFIED'>('IDLE')
    const [verificationCode, setVerificationCode] = useState('')
    const [isVerifying, setIsVerifying] = useState(false)

    // Send numeric code (Mock)
    const handleSendCode = async () => {
        if (phone.length < 10) {
            toast.error('Número incompleto (mínimo 10 dígitos)')
            return
        }

        setVerificationStep('SENDING')
        try {
            const res = await fetch('/api/verify/start', {
                method: 'POST',
                body: JSON.stringify({ phone: `52${phone}` })
            })
            if (!res.ok) throw new Error('Error enviando código')

            setVerificationStep('SENT')
            toast.success('Código enviado por WhatsApp (Simulado)')
        } catch (error) {
            toast.error('Error al enviar. Intenta de nuevo.')
            setVerificationStep('IDLE')
        }
    }

    // Check code (Mock)
    const handleVerifyCode = async () => {
        setIsVerifying(true)
        try {
            const res = await fetch('/api/verify/check', {
                method: 'POST',
                body: JSON.stringify({ phone: `52${phone}`, code: verificationCode })
            })

            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error('Código incorrecto. Intenta: 123456')
                setIsVerifying(false)
                return
            }

            setVerificationStep('VERIFIED')
            toast.success('¡Número verificado correctamente!')
        } catch (error) {
            toast.error('Error verificando código')
            setIsVerifying(false)
        }
    }

    // Submit form wrapper
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (verificationStep !== 'VERIFIED') {
            toast.error('Por favor verifica tu número primero')
            return
        }

        setIsLoading(true)
        const formData = new FormData(e.currentTarget)
        // Ensure format is saved correctly in DB too via action logic
        formData.set('phone', `52${phone}`)

        try {
            await completeOnboarding(formData)
            // Redirect handled by server action usually, but just in case
        } catch (error) {
            console.error(error)
            toast.error('Error al guardar datos')
            setIsLoading(false)
        }
    }

    const mexicanStates = [
        "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
    ]

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-white">¡Bienvenido a HappyMeter! 🎉</h1>
                    <p className="text-gray-400">Antes de empezar, validemos tu negocio.</p>
                </div>

                <div className="bg-[#111] p-8 rounded-2xl border border-white/10 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Store className="w-4 h-4" /> Nombre del Negocio <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="businessName"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600"
                                    placeholder="Ej. Restaurante La Plaza"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <Store className="w-4 h-4" /> Giro del Negocio <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        name="industry"
                                        required
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition appearance-none cursor-pointer"
                                        defaultValue="restaurant"
                                    >
                                        <option value="restaurant">Restaurante / Cafetería</option>
                                        <option value="bar">Bar / Antro / Vida Nocturna</option>
                                        <option value="hotel">Hotel / Hospitalidad</option>
                                        <option value="retail">Tienda / Retail / Moda</option>
                                        <option value="medical">Salud / Clínica / Consultorio</option>
                                        <option value="service" className="text-gray-400">Otro Servicio</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Estado <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        name="state"
                                        required
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition appearance-none cursor-pointer"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Selecciona tu estado</option>
                                        {mexicanStates.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Ciudad <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="city"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600"
                                    placeholder="Ej. Guadalajara"
                                />
                            </div>
                        </div>

                        {/* Phone Verification Section */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                <Phone className="w-4 h-4" /> WhatsApp del Negocio <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                {/* Prefix */}
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none select-none text-gray-500 font-medium z-10 border-r border-white/10 pr-2">
                                    <span>🇲🇽</span>
                                    <span>+52</span>
                                </div>

                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        if (verificationStep === 'VERIFIED') return // Lock if verified
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                                        setPhone(val)
                                    }}
                                    disabled={verificationStep === 'VERIFIED'}
                                    className={`w-full bg-black/50 border rounded-xl pl-28 pr-12 py-3 text-white focus:outline-none focus:ring-2 transition placeholder:text-gray-600 tracking-wider font-mono
                                        ${verificationStep === 'VERIFIED' ? 'border-green-500/50 text-green-400 bg-green-900/10' : 'border-white/10 focus:ring-violet-500'}
                                    `}
                                    placeholder="55 1234 5678"
                                />

                                {/* Status Icon */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    {verificationStep === 'VERIFIED' && (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    )}
                                </div>
                            </div>

                            {/* Verification Actions */}
                            {verificationStep !== 'VERIFIED' && (
                                <div className="mt-2">
                                    {verificationStep === 'IDLE' && phone.length >= 10 && (
                                        <button
                                            type="button"
                                            onClick={handleSendCode}
                                            className="w-full py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Enviar código por WhatsApp
                                        </button>
                                    )}

                                    {verificationStep === 'SENDING' && (
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-400 py-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                                        </div>
                                    )}

                                    {verificationStep === 'SENT' && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={verificationCode}
                                                    onChange={(e) => setVerificationCode(e.target.value)}
                                                    placeholder="Código (123456)"
                                                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-center text-white tracking-[0.5em] font-mono focus:ring-2 focus:ring-violet-500 outline-none"
                                                    maxLength={6}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleVerifyCode}
                                                    disabled={isVerifying || verificationCode.length < 6}
                                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
                                                >
                                                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verificar'}
                                                </button>
                                            </div>
                                            <p className="text-xs text-center text-gray-500">
                                                Código de prueba: <span className="text-gray-300 font-mono">123456</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {verificationStep === 'VERIFIED' && (
                                <p className="text-xs text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Número verificado exitosamente
                                </p>
                            )}
                        </div>

                        <div className="space-y-4 pt-2 border-t border-white/5 mt-6">
                            <h3 className="text-sm font-medium text-gray-400">Redes Sociales (Opcional)</h3>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                    <Instagram className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    name="instagram"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600"
                                    placeholder="Usuario de Instagram"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                    <Facebook className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    name="facebook"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition placeholder:text-gray-600"
                                    placeholder="Usuario de Facebook"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={verificationStep !== 'VERIFIED' || isLoading}
                            className={`w-full font-bold py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2
                                ${verificationStep === 'VERIFIED' && !isLoading
                                    ? 'bg-violet-600 hover:bg-violet-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                            `}
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Completar Registro'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-gray-600">
                    Al continuar, aceptas nuestros términos y condiciones.
                </p>
            </div>
        </div>
    )
}

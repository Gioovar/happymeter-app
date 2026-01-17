"use client"

import { useState, useRef } from "react"
import { authenticateLoyaltyCustomer } from "@/actions/loyalty"
import { upload } from "@vercel/blob/client"
import { toast } from "sonner"
import { Phone, User, ArrowRight, Loader2, Sparkles, Mail, Camera, UploadCloud } from "lucide-react"

interface LoyaltyAuthFormProps {
    programId: string
    businessName: string
    logoUrl?: string | null
    onSuccess: (customer: any) => void
}

export function LoyaltyAuthForm({ programId, businessName, logoUrl, onSuccess }: LoyaltyAuthFormProps) {
    const [step, setStep] = useState<'PHONE' | 'PROFILE'>('PHONE')
    const [phone, setPhone] = useState("")

    // Profile Data
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [photoUrl, setPhotoUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isLoading, setIsLoading] = useState(false)

    const handleSubmitPhone = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone || phone.length < 10) return toast.error("Ingresa un número válido")

        setIsLoading(true)
        try {
            // First attempt: Check if user exists OR create basic
            // We pass EMPTY profile first to see if they exist?
            // Actually, the new signature is `(id, phone, profile ?)`.
            // If we call with JUST phone, it will find or create (without name).
            // But we want to SHOW the profile form if name is missing.

            // Strategy: 
            // 1. Call auth with JUST phone. verify response.
            // 2. If customer exists AND has name => Login Success.
            // 3. If customer exists (or created) BUT has NO name => Show Profile Form.

            const res = await authenticateLoyaltyCustomer(programId, phone)
            if (res.success && res.customer) {
                if (!res.customer.name) {
                    setStep('PROFILE')
                } else {
                    toast.success(`¡Hola de nuevo, ${res.customer.name} !`)
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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return

        const file = e.target.files[0]
        if (file.size > 5 * 1024 * 1024) return toast.error("La imagen debe pesar menos de 5MB")

        setIsUploading(true)
        try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            })
            setPhotoUrl(newBlob.url)
            toast.success("Foto subida")
        } catch (error) {
            console.error(error)
            toast.error("Error al subir imagen")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmitProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return toast.error("El nombre es obligatorio")

        setIsLoading(true)
        try {
            const res = await authenticateLoyaltyCustomer(programId, phone, {
                name,
                email: email || undefined,
                photoUrl: photoUrl || undefined
            })

            if (res.success) {
                toast.success("¡Perfil completado!")
                onSuccess(res.customer)
            } else {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error("Error al guardar perfil")
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
                        <form onSubmit={handleSubmitProfile} className="relative z-10 space-y-5 animate-in slide-in-from-right-8 duration-300">

                            {/* Photo Upload */}
                            <div className="flex justify-center mb-2">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 hover:border-indigo-500/50 transition-all overflow-hidden group/photo"
                                >
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera className="w-8 h-8 text-gray-500 group-hover/photo:text-indigo-400 transition-colors" />
                                    )}

                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                    />
                                    {!photoUrl && <div className="absolute bottom-2 text-[8px] text-gray-500 uppercase font-bold tracking-wider">Foto (Opcional)</div>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Name Input */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Tu Nombre <span className="text-indigo-400">*</span></label>
                                    <div className="relative group/input">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/input:text-indigo-400 transition-colors" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ej. Juan Pérez"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Input */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Correo <span className="text-gray-600">(Opcional)</span></label>
                                    <div className="relative group/input">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/input:text-indigo-400 transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="hola@ejemplo.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-base text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || isUploading || !name}
                                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg mt-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Completar Registro"}
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

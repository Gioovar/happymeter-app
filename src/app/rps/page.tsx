'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Lock, ShieldCheck, Sparkles, AlertCircle, User, Phone, UploadCloud, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import Image from 'next/image'
import { verifyPromoterPhone, setupGlobalPromoter, verifyGlobalPromoterPin, createGlobalPromoterSession } from '@/actions/promoters'

type Step = 'search' | 'create_profile' | 'enter_pin'

export default function RpsGlobalLoginPortal() {
    const router = useRouter()

    const [step, setStep] = useState<Step>('search')
    const [phone, setPhone] = useState('')
    const [pin, setPin] = useState('')
    const [confirmPin, setConfirmPin] = useState('')

    // Profile Creation Data
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [bankAccount, setBankAccount] = useState('')
    const [photoBase64, setPhotoBase64] = useState<string | null>(null)

    const [promoterData, setPromoterData] = useState<{ name?: string, email?: string, avatarUrl?: string | null } | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // PIN UX states
    const [pinShake, setPinShake] = useState(false)
    const [pinSuccess, setPinSuccess] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        let cleanPhone = phone.replace(/[^0-9]/g, '')
        
        // Auto-remove +52 country code if it got past the onChange or was typed as 52...
        if (cleanPhone.length === 12 && cleanPhone.startsWith('52')) {
            cleanPhone = cleanPhone.substring(2)
        }

        if (cleanPhone.length !== 10) {
            setError("Por favor ingresa un número de teléfono válido a 10 dígitos.")
            return
        }

        setIsLoading(true)
        try {
            const result = await verifyPromoterPhone(cleanPhone)
            if (result.success && result.data) {
                setPhone(cleanPhone)
                setPromoterData(result.data as any)

                if (result.hasPin) {
                    setStep('enter_pin')
                } else {
                    // Start Profile Setup
                    setName(result.data.name || "")
                    setEmail(result.data.email || "")
                    setStep('create_profile')
                }
            } else {
                setError(result.error || "Este número no está registrado como Promotor.")
            }
        } catch (err: any) {
            setError("Ocurrió un error de conexión.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 5 * 1024 * 1024) {
            setError("La imagen no debe pesar más de 5MB")
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            setPhotoBase64(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSetupProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!name || !email) {
            setError("Por favor completa tu Nombre y Correo.")
            return
        }
        if (pin.length !== 4 || isNaN(Number(pin))) {
            setError("El PIN debe ser exactamente de 4 dígitos.")
            return
        }
        if (pin !== confirmPin) {
            setError("Los PINs no coinciden.")
            return
        }

        setIsLoading(true)
        try {
            // Provide a default empty avatar if none selected (can be handled backend side or default UI side later)
            const setupRes = await setupGlobalPromoter(phone, pin, name, email, photoBase64 || "", bankAccount)
            if (setupRes.success) {
                await createGlobalPromoterSession(phone)
                router.push(`/rps/wallet`)
            } else {
                setError(setupRes.error || "Error al crear el perfil.")
            }
        } catch (err) {
            setError("Ocurrió un error al configurar la cuenta.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEnterPin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (pin.length !== 4 || isNaN(Number(pin))) {
            setError("El PIN debe ser de 4 dígitos.")
            triggerShake()
            return
        }

        setIsLoading(true)
        try {
            const verifyRes = await verifyGlobalPromoterPin(phone, pin)
            if (verifyRes.success) {
                // Haptic feedback on success (mobile)
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50)
                setPinSuccess(true)
                await createGlobalPromoterSession(phone)
                // Keep loading active — navigate without resetting state
                router.push(`/rps/wallet`)
                // Intentionally NOT calling setIsLoading(false) on success
                return
            } else {
                // Haptic feedback on error (mobile)
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([80, 40, 80])
                setError(verifyRes.error || "PIN Incorrecto. Intenta de nuevo.")
                setPin('')
                triggerShake()
            }
        } catch (err) {
            setError("Error de conexión. Intenta de nuevo.")
            setPin('')
            triggerShake()
        } finally {
            if (!pinSuccess) setIsLoading(false)
        }
    }

    const triggerShake = () => {
        setPinShake(true)
        setTimeout(() => setPinShake(false), 600)
    }

    return (
        <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-indigo-500/30">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Logo Header */}
            <div className="fixed top-8 left-8 flex items-center gap-2 z-50">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-black tracking-tight text-white hidden sm:block">Happy<span className="text-zinc-500">Meters</span> RPS</span>
            </div>

            <div className="w-full max-w-md relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Hero section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 mb-2 ring-1 ring-inset ring-white/5">
                        {step === 'search' ? (
                            <><ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Billetera de Promotor</>
                        ) : (
                            <><Lock className="w-3.5 h-3.5 text-indigo-400" /> Acceso Seguro</>
                        )}
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-500">
                        {step === 'search' && "Accede a tu cuenta"}
                        {step === 'create_profile' && "Comienza tu perfil"}
                        {step === 'enter_pin' && "¡Hola de nuevo!"}
                    </h1>

                    <p className="text-zinc-500 text-sm sm:text-base max-w-[280px] mx-auto leading-relaxed">
                        {step === 'search' && "Ingresa tu número de celular para ver todas tus sucursales y ganancias."}
                        {step === 'create_profile' && `Completa tu información y crea un PIN de 4 dígitos para tu billetera.`}
                        {step === 'enter_pin' && `Ingresa tu PIN de 4 dígitos para acceder a tu billetera.`}
                    </p>
                </div>

                {/* Form Card */}
                <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="p-8 relative z-10">

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                <p className="text-xs text-red-200 font-medium">{error}</p>
                            </div>
                        )}

                        {step === 'search' && (
                            <form onSubmit={handleSearch} className="space-y-6 animate-in slide-in-from-right-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                                        Número de Teléfono
                                    </label>
                                    <div className="relative flex items-center">
                                        <Phone className="absolute left-4 w-5 h-5 text-zinc-500 pointer-events-none" />
                                        <Input
                                            type="tel"
                                            placeholder="55 1234 5678"
                                            value={phone}
                                            onChange={(e) => {
                                                let val = e.target.value
                                                if (val.startsWith('+52')) val = val.substring(3).trim()
                                                setPhone(val)
                                            }}
                                            className="h-14 pl-12 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:bg-black focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-2xl transition-all font-mono text-lg"
                                            autoComplete="off"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading || phone.replace(/[^0-9]/g, '').length < 10}
                                    className="w-full h-14 bg-white hover:bg-zinc-200 text-black font-bold rounded-2xl text-[15px] shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all group/btn"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                            <span>Buscando...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span>Siguiente</span>
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>
                            </form>
                        )}

                        {step === 'create_profile' && (
                            <form onSubmit={handleSetupProfile} className="space-y-6 animate-in slide-in-from-right-4">

                                {/* Photo Upload */}
                                <div className="flex flex-col items-center gap-3">
                                    <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden bg-black/50 border-2 border-dashed border-zinc-700 hover:border-indigo-500 transition-colors">
                                        {photoBase64 ? (
                                            <Image src={photoBase64} alt="Preview" fill className="object-cover" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
                                                <UploadCloud className="w-6 h-6 mb-1" />
                                                <span className="text-[9px] uppercase font-bold text-center leading-tight">Subir<br />Foto</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium">Toca para subir tu mejor foto (opcional)</p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                        <div className="relative flex items-center">
                                            <User className="absolute left-4 w-4 h-4 text-zinc-500" />
                                            <Input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="h-12 pl-10 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:bg-black focus:border-indigo-500/50 rounded-xl"
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-white/5">
                                        
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Teléfono Registrado (No Editable)</label>
                                            <div className="relative flex items-center">
                                                <Lock className="absolute left-4 w-4 h-4 text-emerald-500" />
                                                <Input
                                                    type="text"
                                                    value={phone}
                                                    className="h-12 pl-10 bg-black/80 border-white/5 text-zinc-500 font-mono focus:ring-0 cursor-not-allowed opacity-70"
                                                    disabled
                                                    readOnly
                                                />
                                            </div>
                                            <p className="text-[10px] text-zinc-500 leading-tight">Tu número es la llave de acceso a todas tus sucursales actuales y futuras. Si solicitas cambiarlo, avisa a tu RH.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Cuenta Bancaria / CLABE</label>
                                            <div className="relative flex items-center">
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    maxLength={18}
                                                    value={bankAccount}
                                                    onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ''))}
                                                    placeholder="Ej. 123456789012345678 (La puedes poner ahora o después)"
                                                    className="h-12 px-4 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:bg-black focus:border-indigo-500/50 rounded-xl font-mono text-sm tracking-widest"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            <p className="text-[10px] text-indigo-400/80 leading-tight">Aquí recibirás todos los depósitos correspondientes a tus cortes y comisiones.</p>
                                        </div>

                                        <div className="space-y-2 pt-2">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 text-center block">Crea tu PIN de Acceso (4 Dígitos)</label>
                                            <Input
                                                type="password"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={4}
                                                placeholder="••••"
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="h-12 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:bg-black focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl transition-all font-mono text-xl tracking-widest text-center"
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 text-center block">Confirmar</label>
                                            <Input
                                                type="password"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={4}
                                                placeholder="••••"
                                                value={confirmPin}
                                                onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="h-12 bg-black/50 border-white/10 text-white placeholder:text-zinc-600 focus:bg-black focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 rounded-xl transition-all font-mono text-xl tracking-widest text-center"
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || pin.length !== 4 || confirmPin.length !== 4 || !name || !email}
                                    className="w-full h-14 mt-6 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl text-[15px] shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:shadow-[0_0_50px_rgba(99,102,241,0.4)] transition-all group/btn"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Guardando Perfil...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span>Crear mi Billetera</span>
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setStep('search')}
                                    className="w-full text-center text-xs text-zinc-500 hover:text-white transition-colors"
                                    disabled={isLoading}
                                >
                                    Volver atrás
                                </button>
                            </form>
                        )}

                        {step === 'enter_pin' && (
                            <form onSubmit={handleEnterPin} className="space-y-6 animate-in slide-in-from-right-4">
                                {/* Profile card */}
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex flex-col items-center justify-center shrink-0 border border-indigo-500/30 overflow-hidden relative">
                                            {promoterData?.avatarUrl ? (
                                                <Image src={promoterData.avatarUrl} alt="Avatar" fill className="object-cover" />
                                            ) : (
                                                <span className="font-bold text-indigo-400 text-lg">{promoterData?.name?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{promoterData?.name}</p>
                                            <p className="text-zinc-400 text-xs font-mono">{phone}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setStep('search'); setPin(''); setError(null) }}
                                        disabled={isLoading}
                                        className="text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 bg-indigo-500/10 rounded-md transition-colors disabled:opacity-40"
                                    >
                                        Cambiar
                                    </button>
                                </div>

                                {/* PIN Input with shake animation */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1 text-center block mb-2">PIN de Acceso</label>
                                    <style>{`
                                        @keyframes shake {
                                            0%,100%{transform:translateX(0)}
                                            15%{transform:translateX(-8px)}
                                            30%{transform:translateX(8px)}
                                            45%{transform:translateX(-6px)}
                                            60%{transform:translateX(6px)}
                                            75%{transform:translateX(-4px)}
                                            90%{transform:translateX(4px)}
                                        }
                                        .pin-shake { animation: shake 0.55s cubic-bezier(.36,.07,.19,.97) both; }
                                        @keyframes pulse-border {
                                            0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0);}
                                            50%{box-shadow:0 0 0 4px rgba(99,102,241,0.3);}
                                        }
                                        .pin-success-border { animation: pulse-border 0.8s ease-out; }
                                    `}</style>
                                    <Input
                                        type="password"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={4}
                                        placeholder="••••"
                                        value={pin}
                                        onChange={(e) => {
                                            setPin(e.target.value.replace(/[^0-9]/g, ''))
                                            if (error) setError(null)
                                        }}
                                        className={`h-16 border-2 text-white placeholder:text-zinc-600 rounded-2xl transition-all duration-200 font-mono text-3xl tracking-[1em] text-center
                                            ${ pinShake ? 'pin-shake border-red-500/70 bg-red-500/10' :
                                               pinSuccess ? 'pin-success-border border-emerald-500/70 bg-emerald-500/10' :
                                               'bg-black/50 border-white/10 focus:bg-black focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50'
                                            }`}
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                    {/* Auto-submit hint */}
                                    {pin.length === 4 && !isLoading && (
                                        <p className="text-[11px] text-indigo-400/80 text-center animate-in fade-in duration-200">
                                            Presiona Entrar o la tecla ↵
                                        </p>
                                    )}
                                </div>

                                {/* Submit Button — premium states */}
                                <Button
                                    type="submit"
                                    disabled={isLoading || pin.length !== 4}
                                    className={`w-full h-14 font-bold rounded-2xl text-[15px] transition-all duration-300 relative overflow-hidden
                                        ${ pinSuccess
                                            ? 'bg-emerald-500 hover:bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] cursor-default'
                                            : isLoading
                                            ? 'bg-indigo-600 cursor-wait shadow-[0_0_30px_rgba(99,102,241,0.3)]'
                                            : 'bg-indigo-500 hover:bg-indigo-600 shadow-[0_0_40px_rgba(99,102,241,0.2)] hover:shadow-[0_0_50px_rgba(99,102,241,0.4)] group/btn'
                                        }`}
                                >
                                    {/* Background shimmer while loading */}
                                    {isLoading && !pinSuccess && (
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite] translate-x-[-100%]" style={{animation:'shimmer 1.5s infinite',backgroundSize:'200% 100%'}} />
                                    )}

                                    {pinSuccess ? (
                                        <div className="flex items-center justify-center gap-2 animate-in zoom-in-75 duration-300">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>¡Acceso Concedido!</span>
                                        </div>
                                    ) : isLoading ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                                            <span className="tracking-wide">Validando acceso...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2">
                                            <span>Entrar</span>
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </div>
                                    )}
                                </Button>

                                {/* Blocking overlay while loading to prevent any interaction */}
                                {isLoading && (
                                    <div className="fixed inset-0 z-[200] cursor-wait" aria-hidden="true" />
                                )}
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Footer text */}
                <p className="text-center text-zinc-600 text-xs font-medium">
                    Plataforma Exclusiva para Relaciones Públicas
                </p>
            </div>

            {/* Bottom branding */}
            <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none">
                <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold">
                    Powered by HappyMeter
                </p>
            </div>
        </main >
    )
}

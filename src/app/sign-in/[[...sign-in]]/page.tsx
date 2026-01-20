'use client'

import { useSignIn } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicLoyaltyProgramInfo } from "@/actions/loyalty";
import { Phone, Mail, ArrowLeft, Loader2, Lock, AlertCircle, Eye, EyeOff, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import ParticleBackground from "@/components/landing/ParticleBackground";

export default function Page() {
    const { signIn, isLoaded, setActive } = useSignIn();
    const searchParams = useSearchParams()
    const router = useRouter()

    // URL Params
    const intent = searchParams.get('intent')
    const finalRedirect = searchParams.get('redirect_url')
    const programId = searchParams.get('program_id')

    // State
    const [programInfo, setProgramInfo] = useState<any>(null)
    const [view, setView] = useState<'selection' | 'email_flow' | 'phone_flow'>('selection')
    const [emailStep, setEmailStep] = useState<'email' | 'password'>('email')
    const [phoneStep, setPhoneStep] = useState<'phone' | 'code'>('phone')

    // Form Values
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [phone, setPhone] = useState('')
    const [code, setCode] = useState('')

    // UI State
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (programId) {
            getPublicLoyaltyProgramInfo(programId).then(setProgramInfo)
        }
    }, [programId])

    let redirectUrl = finalRedirect || '/dashboard' // Default to dashboard if no redirect

    // Handle intents specifically
    if (intent === 'creator') {
        redirectUrl = '/api/auth-callback?signup_intent=creator'
    } else if (intent === 'view_pricing') {
        redirectUrl = '/api/auth-callback?signup_intent=view_pricing'
    }

    // ----------------------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------------------

    const handleGoogleSignIn = async () => {
        if (!isLoaded) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: redirectUrl,
            });
        } catch (err: any) {
            console.error("Error signing in with Google", err);
            setError("Error al iniciar con Google. Intenta nuevamente.")
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return
        setIsLoading(true)
        setError('')

        try {
            // Initiate Sign In with Email
            const { status, supportedFirstFactors } = await signIn.create({
                identifier: email,
            })

            if (status === 'needs_first_factor') {
                // Check if password is supported
                const isPasswordSupported = supportedFirstFactors?.find((factor: any) => factor.strategy === 'password')

                if (isPasswordSupported) {
                    setEmailStep('password')
                } else {
                    setError('Tu cuenta usa otro método de verificación. Por favor usa Google o confirma tu configuración.')
                }
            } else {
                setError('Estado de inicio de sesión no soportado: ' + status)
            }
        } catch (err: any) {
            console.error(err)
            if (err.errors?.[0]?.code === 'form_identifier_not_found') {
                setError('No encontramos una cuenta con este correo.')
            } else {
                setError(err.errors?.[0]?.message || 'Error al validar correo.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return
        setIsLoading(true)
        setError('')

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'password',
                password,
            })

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                router.push(redirectUrl)
            } else {
                console.log(result)
                setError('Verificación incompleta. Por favor revisa tu correo.')
            }
        } catch (err: any) {
            if (err.errors?.[0]?.code === 'form_password_incorrect') {
                setError('Contraseña incorrecta.')
            } else {
                setError('Error al iniciar sesión.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    // PHONE HANDLERS
    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return
        setIsLoading(true)
        setError('')

        try {
            // Initiate Sign In with Phone
            // Ensure format is E.164 usually required by Clerk
            const formattedPhone = phone.startsWith('+') ? phone : `+${phone}` // Basic check

            const { status, supportedFirstFactors } = await signIn.create({
                identifier: formattedPhone,
            })

            if (status === 'needs_first_factor') {
                // Check if phone_code is supported
                const phoneFactor = supportedFirstFactors?.find((factor: any) => factor.strategy === 'phone_code')

                if (phoneFactor) {
                    // Prepare the factor (send SMS)
                    await signIn.prepareFirstFactor({
                        strategy: 'phone_code',
                        phoneNumberId: phoneFactor.phoneNumberId,
                    })
                    setPhoneStep('code')
                } else {
                    setError('Tu cuenta no soporta inicio con código SMS.')
                }
            } else {
                setError('Estado no soportado: ' + status)
            }
        } catch (err: any) {
            console.error(err)
            if (err.errors?.[0]?.code === 'form_identifier_not_found') {
                setError('No encontramos una cuenta con este número.')
            } else {
                setError(err.errors?.[0]?.message || 'Error al enviar código. Verifica el número.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isLoaded) return
        setIsLoading(true)
        setError('')

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'phone_code',
                code,
            })

            if (result.status === 'complete') {
                await setActive({ session: result.createdSessionId })
                router.push(redirectUrl)
            } else {
                console.log(result)
                setError('Código inválido o expirado.')
            }
        } catch (err: any) {
            console.error(err)
            if (err.errors?.[0]?.code === 'verification_code_incorrect') {
                setError('Código incorrecto.')
            } else {
                setError('Error al verificar código.')
            }
        } finally {
            setIsLoading(false)
        }
    }


    // Helper to Reset View
    const reset = () => {
        setView('selection')
        setEmailStep('email')
        setPhoneStep('phone')
        setError('')
        setPassword('')
        setCode('')
    }

    // ----------------------------------------------------------------------
    // UI Elements
    // ----------------------------------------------------------------------

    return (
        <div className="min-h-screen bg-[#0a0a0a] grid lg:grid-cols-2 font-sans selection:bg-violet-500/30">

            {/* Left Column - Hero */}
            <div className="hidden lg:flex flex-col relative justify-between p-12 bg-[#050505] overflow-hidden border-r border-white/5">

                {/* Antigravity Particles */}
                <div className="absolute inset-0 z-0 opacity-50">
                    <ParticleBackground />
                </div>

                {/* Minimalist Gradients (Still subtle) */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3 z-0" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-900/10 blur-[120px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3 z-0" />

                <div className="relative z-10"><BrandLogo /></div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
                        {programInfo ? (
                            <>
                                Bienvenido a <br />
                                <span className="text-violet-400">{programInfo.businessName}</span>
                            </>
                        ) : (
                            <>
                                Gestiona tu negocio <br />
                                <span className="text-gray-500">con inteligencia real.</span>
                            </>
                        )}
                    </h1>
                    <p className="text-lg text-gray-400 leading-relaxed text-balance">
                        {programInfo
                            ? "Accede para gestionar tus puntos y recompensas."
                            : "La plataforma todo-en-uno para medir, premiar y crecer."
                        }
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-xs font-medium text-gray-600 uppercase tracking-widest">
                    HappyMeters AI 2.0
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex flex-col items-center justify-center p-6 md:p-12 relative">
                {/* Mobile Logo */}
                <div className="lg:hidden mb-12"><BrandLogo size="lg" /></div>

                <div className="w-full max-w-[400px] relative z-10">

                    {/* VIEW: SELECTION */}
                    {view === 'selection' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h2>
                                <p className="text-gray-400 text-sm">Elige cómo quieres empezar</p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleGoogleSignIn}
                                    className="w-full h-14 bg-white hover:bg-gray-100 text-black font-bold text-lg rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98] shadow-lg shadow-white/5"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continuar con Google
                                </button>

                                <div className="flex items-center gap-4 py-4">
                                    <div className="h-px bg-white/10 flex-1" />
                                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">O CONTÍNUA CON</span>
                                    <div className="h-px bg-white/10 flex-1" />
                                </div>

                                <div className="grid gap-3">
                                    <button
                                        onClick={() => setView('phone_flow')}
                                        className="w-full h-14 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 hover:border-white/20 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                                    >
                                        <Smartphone className="w-5 h-5 text-[#00FF00] group-hover:text-[#00DD00] transition-colors" />
                                        Continuar con teléfono
                                    </button>

                                    <button
                                        onClick={() => setView('email_flow')}
                                        className="w-full h-14 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 hover:border-white/20 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                                    >
                                        <Mail className="w-5 h-5 text-[#00FF00] group-hover:text-[#00DD00] transition-colors" />
                                        Continuar con correo electrónico
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* VIEW: EMAIL FLOW */}
                    {view === 'email_flow' && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <button
                                onClick={reset}
                                className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-sm font-medium pl-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver
                            </button>
                            {/* ... Same as before ... */}
                            {emailStep === 'password' ? (
                                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white mb-1">Bienvenido de nuevo</h2>
                                        <p className="text-gray-400 text-sm">{email}</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-500 ml-1 uppercase">Contraseña</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                <Lock className="w-5 h-5" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-[#111] border border-white/10 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 h-14 rounded-xl pl-12 pr-12 text-base outline-none transition-all placeholder:text-gray-700"
                                                placeholder="••••••••"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                    >
                                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                                        Iniciar Sesión
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleEmailSubmit} className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white mb-1">Ingresa tu correo</h2>
                                        <p className="text-gray-400 text-sm">Te enviaremos un código o enlace de acceso</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-500 ml-1 uppercase">Correo Electrónico</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-[#111] border border-white/10 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 h-14 rounded-xl pl-12 pr-4 text-base outline-none transition-all placeholder:text-gray-700"
                                                placeholder="nombre@empresa.com"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                    >
                                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                                        Continuar
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* VIEW: PHONE FLOW */}
                    {view === 'phone_flow' && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <button
                                onClick={reset}
                                className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-sm font-medium pl-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver
                            </button>

                            {phoneStep === 'code' ? (
                                <form onSubmit={handleCodeSubmit} className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white mb-1">Código de verificación</h2>
                                        <p className="text-gray-400 text-sm">Enviado a {phone}</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-500 ml-1 uppercase">Código SMS</label>
                                        <input
                                            type="text"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            className="w-full bg-[#111] border border-white/10 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 h-14 rounded-xl px-4 text-center text-xl tracking-widest outline-none transition-all placeholder:text-gray-800"
                                            placeholder="000000"
                                            autoFocus
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                    >
                                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                                        Verificar
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white mb-1">Ingresa tu teléfono</h2>
                                        <p className="text-gray-400 text-sm">Te enviaremos un código SMS para acceder</p>
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-500 ml-1 uppercase">Número de teléfono</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                                <Smartphone className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className="w-full bg-[#111] border border-white/10 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 h-14 rounded-xl pl-12 pr-4 text-base outline-none transition-all placeholder:text-gray-700"
                                                placeholder="+52 123 456 7890"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-14 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                                    >
                                        {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                                        Enviar Código
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    <div className="mt-8 text-center bg-[#111]/50 py-4 rounded-xl border border-white/5 backdrop-blur-sm">
                        <p className="text-gray-500 text-sm">
                            ¿Aún no tienes cuenta?{' '}
                            <a href={`/sign-up?intent=${intent || ''}&program_id=${programId || ''}&redirect_url=${finalRedirect || ''}`} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Inicia sesión</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { SignIn, SignUp } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { loginOfflineOperator } from '@/actions/team';
import { Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function OpsLoginContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const initialMode = searchParams.get('mode') as 'signin' | 'signup' | 'offline' | null
    const redirectUrl = searchParams.get('redirect_url') || "/ops/tasks"
    const signupRedirect = searchParams.get('redirect_url') || "/ops/profile-setup"

    const [mode, setMode] = useState<'signin' | 'signup' | 'offline'>(initialMode || 'offline')
    const [accessCode, setAccessCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (initialMode && ['signin', 'signup', 'offline'].includes(initialMode)) {
            setMode(initialMode)
        }
    }, [initialMode])

    const handleOfflineLogin = async () => {
        if (!accessCode || accessCode.length < 6) {
            toast.error("Ingresa un código válido")
            return
        }

        setIsLoading(true)
        try {
            const res = await loginOfflineOperator(accessCode)
            if (res.success) {
                // @ts-ignore
                toast.success(`Bienvenido ${res.member?.name || 'Operador'}`)
                router.push("/ops/tasks")
            } else {
                toast.error(res.error || "Código inválido")
            }
        } catch (error) {
            toast.error("Error de conexión")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#030014] flex flex-col items-center justify-center p-4 pb-20 relative overflow-hidden">

            {/* Premium Animated Background Elements */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                {/* Latidos / Pulsing lights */}
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[600px] max-h-[600px] bg-violet-600/30 rounded-full blur-[100px] animate-pulse relative" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-[-10%] right-[-20%] w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse relative" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                <div className="absolute top-[30%] left-[20%] w-[50vw] h-[50vw] max-w-[400px] max-h-[400px] bg-indigo-500/20 rounded-full blur-[90px] animate-pulse relative" style={{ animationDuration: '5s', animationDelay: '2s' }} />

                {/* Subtle grid overlay for texture */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 mix-blend-overlay"></div>
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col gap-8 mt-auto mb-auto">

                {/* Header for Staff */}
                <div className="text-center space-y-5">
                    <div className="flex justify-center mb-4 relative">
                        {/* Glow behind logo */}
                        <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full scale-150"></div>
                        <div className="relative">
                            <BrandLogo size="lg" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tight drop-shadow-sm">Portal Staff</h1>
                        <p className="text-violet-200/60 font-medium text-sm tracking-wide uppercase">Acceso Operativo</p>
                    </div>
                </div>

                {/* Custom Clerk Auth Forms */}
                {/* Custom Clerk Auth Forms */}
                <div className="w-full flex justify-center min-h-[400px]">
                    {mode === 'signin' ? (
                        <div className="w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 relative">
                            {/* Fallback info when Clerk blocks localhost/IPs */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4 -z-10 blur-0">
                                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                                <p className="text-white/40 text-sm">Cargando conexión segura...</p>
                                <p className="text-white/20 text-xs px-4">Si el formulario no carga en el emulador, intenta usar el <b>Ingreso con Código PIN</b> abajo.</p>
                            </div>
                            <SignIn
                                appearance={{
                                    elements: {
                                        rootBox: "w-full flex justify-center z-10",
                                        card: "bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.1)] rounded-[32px] w-full p-6 md:p-8",
                                        headerTitle: "text-white font-bold text-xl",
                                        headerSubtitle: "text-violet-200/60",
                                        socialButtonsBlockButton: "bg-[#030014]/50 border-white/10 hover:bg-white/10 text-white transition-all",
                                        socialButtonsProviderIcon: "filter brightness-0 invert",
                                        dividerLine: "bg-white/10",
                                        dividerText: "text-white/40",
                                        formFieldLabel: "text-white/70",
                                        formFieldInput: "bg-[#030014]/50 border-white/10 text-white focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl transition-all",
                                        footerAction: "hidden",
                                        formButtonPrimary: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white py-3 rounded-xl shadow-lg shadow-violet-900/20 font-bold",
                                        identityPreviewText: "text-slate-300",
                                        formFieldInputShowPasswordButton: "text-white/40"
                                    },
                                    layout: {
                                        socialButtonsPlacement: 'bottom',
                                        showOptionalFields: false
                                    }
                                }}
                                forceRedirectUrl={redirectUrl}
                            />
                        </div>
                    ) : mode === 'signup' ? (
                        <div className="w-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300 relative">
                            {/* Fallback info when Clerk blocks localhost/IPs */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4 -z-10 blur-0 opacity-50">
                                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                            </div>
                            <SignUp
                                appearance={{
                                    elements: {
                                        rootBox: "w-full flex justify-center z-10",
                                        card: "bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.1)] rounded-[32px] w-full p-6 md:p-8",
                                        headerTitle: "text-white font-bold text-xl",
                                        headerSubtitle: "text-violet-200/60",
                                        socialButtonsBlockButton: "bg-[#030014]/50 border-white/10 hover:bg-white/10 text-white transition-all",
                                        socialButtonsProviderIcon: "filter brightness-0 invert",
                                        dividerLine: "bg-white/10",
                                        dividerText: "text-white/40",
                                        formFieldLabel: "text-white/70",
                                        formFieldInput: "bg-[#030014]/50 border-white/10 text-white focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 rounded-xl transition-all",
                                        footerAction: "hidden",
                                        formButtonPrimary: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white py-3 rounded-xl shadow-lg shadow-violet-900/20 font-bold",
                                        identityPreviewText: "text-slate-300",
                                        formFieldInputShowPasswordButton: "text-white/40"
                                    },
                                    layout: {
                                        socialButtonsPlacement: 'bottom',
                                        showOptionalFields: false
                                    }
                                }}
                                forceRedirectUrl={signupRedirect}
                            />
                        </div>
                    ) : (
                        <div className="w-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
                            <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.1)] rounded-[32px] w-full p-8 md:p-10 space-y-8 relative overflow-hidden">
                                {/* Inner glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>

                                <div className="text-center space-y-2">
                                    <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-sm">Ingreso Rápido</h2>
                                    <p className="text-violet-200/60 text-sm font-medium">Ingresa el PIN de 6 dígitos proporcionado por gerencia.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition duration-500"></div>
                                        <div className="relative relative flex items-center">
                                            <KeyRound className="absolute left-4 w-6 h-6 text-violet-400/70" />
                                            <Input
                                                placeholder="000 000"
                                                value={accessCode}
                                                onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="bg-[#030014]/80 border-white/10 text-white text-center text-3xl font-bold tracking-[0.4em] h-16 pl-14 font-mono focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all rounded-2xl shadow-inner placeholder:text-white/10"
                                                type="tel" // Keypad on mobile
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full h-14 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-white/10"
                                        onClick={handleOfflineLogin}
                                        disabled={isLoading || accessCode.length < 6}
                                    >
                                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="flex items-center justify-center gap-2">Autorizar Acceso <ArrowRight className="w-5 h-5" /></span>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center space-y-4 pb-8 z-20">
                    {mode === 'offline' ? (
                        <div className="flex flex-col items-center gap-3 mt-6">
                            <p className="text-sm font-medium text-white/40 uppercase tracking-widest">Administración</p>
                            <button
                                onClick={() => setMode('signin')}
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-2xl transition-all hover:scale-105 shadow-xl backdrop-blur-md"
                            >
                                Iniciar Sesión con Correo
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 mt-6">
                            <p className="text-sm font-medium text-white/40 uppercase tracking-widest">
                                {mode === 'signin' ? "Acceso Staff" : "Administración"}
                            </p>
                            <button
                                onClick={() => setMode(mode === 'signin' ? 'offline' : 'signin')}
                                className="px-8 py-3 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 hover:from-violet-600/40 hover:to-fuchsia-600/40 border border-violet-500/30 text-white font-semibold rounded-2xl transition-all hover:scale-105 shadow-xl shadow-violet-900/20 backdrop-blur-md"
                            >
                                {mode === 'signin' ? "Ingresar con Código PIN" : "Inicia Sesión con Correo"}
                            </button>
                            {mode === 'signin' && (
                                <div className="pt-2">
                                    <button
                                        onClick={() => setMode('signup')}
                                        className="text-white/30 text-xs font-medium hover:text-white/70 transition-colors"
                                    >
                                        Crear nueva cuenta administrativa
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function OpsLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}>
            <OpsLoginContent />
        </Suspense>
    )
}

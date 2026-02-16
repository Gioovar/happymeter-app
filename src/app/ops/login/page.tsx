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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 pb-20 relative overflow-hidden">

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-3xl opacity-50" />
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col gap-8">

                {/* Header for Staff */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center mb-2">
                        <BrandLogo size="lg" />
                    </div>
                    {/* <h1 className="text-2xl font-bold text-white tracking-tight">Portal Operativo</h1> */}
                    <p className="text-slate-400 text-sm">Portal de Operaciones</p>
                </div>

                {/* Custom Clerk Auth Forms */}
                <div className="w-full">
                    {mode === 'signin' ? (
                        <SignIn
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-full p-8",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    socialButtonsBlockButton: "bg-slate-800 border-white/5 hover:bg-slate-700 text-white",
                                    dividerLine: "bg-slate-700",
                                    dividerText: "text-slate-500",
                                    formFieldLabel: "text-slate-300",
                                    formFieldInput: "bg-slate-950 border-slate-800 text-white focus:border-indigo-500 transition-colors",
                                    footerAction: "hidden",
                                    formButtonPrimary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl",
                                    identityPreviewText: "text-slate-300",
                                    formFieldInputShowPasswordButton: "text-slate-400"
                                },
                                layout: {
                                    socialButtonsPlacement: 'bottom',
                                    showOptionalFields: false
                                }
                            }}
                            forceRedirectUrl={redirectUrl}
                        />
                    ) : mode === 'signup' ? (
                        <SignUp
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-full p-8",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    socialButtonsBlockButton: "bg-slate-800 border-white/5 hover:bg-slate-700 text-white",
                                    dividerLine: "bg-slate-700",
                                    dividerText: "text-slate-500",
                                    formFieldLabel: "text-slate-300",
                                    formFieldInput: "bg-slate-950 border-slate-800 text-white focus:border-indigo-500 transition-colors",
                                    footerAction: "hidden",
                                    formButtonPrimary: "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl",
                                    identityPreviewText: "text-slate-300",
                                    formFieldInputShowPasswordButton: "text-slate-400"
                                },
                                layout: {
                                    socialButtonsPlacement: 'bottom',
                                    showOptionalFields: false
                                }
                            }}
                            forceRedirectUrl={signupRedirect}
                        />
                    ) : (
                        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-full p-8 space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-white">Ingreso con Código</h2>
                                <p className="text-slate-400 text-sm mt-1">Usa el código de 6 dígitos que te dio tu gerente.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        placeholder="000 000"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="bg-slate-950 border-slate-800 text-white text-center text-2xl tracking-[0.5em] h-14 pl-12 font-mono focus:border-indigo-500 transition-colors"
                                        type="tel" // Keypad on mobile
                                    />
                                </div>

                                <Button
                                    className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg shadow-cyan-900/20"
                                    onClick={handleOfflineLogin}
                                    disabled={isLoading || accessCode.length < 6}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2">Ingresar <ArrowRight className="w-4 h-4" /></span>}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center space-y-3">
                    {mode === 'offline' ? (
                        <>
                            <p className="text-xs text-slate-600">¿Eres administrador o tienes cuenta?</p>
                            <button
                                onClick={() => setMode('signin')}
                                className="text-indigo-400 text-xs hover:text-indigo-300 font-medium transition-colors"
                            >
                                Iniciar Sesión con Correo
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-xs text-slate-600">
                                {mode === 'signin' ? "¿Tienes un código de acceso?" : "¿Ya tienes cuenta?"}
                            </p>
                            <button
                                onClick={() => setMode(mode === 'signin' ? 'offline' : 'signin')}
                                className="text-indigo-400 text-xs hover:text-indigo-300 font-medium transition-colors"
                            >
                                {mode === 'signin' ? "Ingresar con Código PIN" : "Inicia sesión"}
                            </button>
                            {mode === 'signin' && (
                                <div className="pt-2">
                                    <button
                                        onClick={() => setMode('signup')}
                                        className="text-slate-500 text-[10px] hover:text-slate-400 transition-colors"
                                    >
                                        Registrar cuenta nueva
                                    </button>
                                </div>
                            )}
                        </>
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

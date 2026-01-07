'use client'

import { SignUp, useSignUp } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicLoyaltyProgramInfo } from "@/actions/loyalty";
import { Sparkles, Mail, Phone, ArrowLeft, Loader2 } from "lucide-react";

export default function Page() {
    const searchParams = useSearchParams()
    const intent = searchParams.get('intent')
    const plan = searchParams.get('plan')
    const interval = searchParams.get('interval')
    const finalRedirect = searchParams.get('redirect_url')
    const programId = searchParams.get('program_id')

    const [programInfo, setProgramInfo] = useState<any>(null)
    const [view, setView] = useState<'selection' | 'form'>('selection')
    const { signUp, isLoaded } = useSignUp()

    useEffect(() => {
        if (programId) {
            getPublicLoyaltyProgramInfo(programId).then(setProgramInfo)
        }
    }, [programId])

    let redirectUrl = finalRedirect || '/api/auth-callback'

    if (intent === 'creator') {
        redirectUrl = '/api/auth-callback?signup_intent=creator'
    } else if (intent === 'checkout' && plan) {
        // Redirect back to pricing to trigger auto-checkout
        const params = new URLSearchParams()
        params.set('checkout', 'true')
        params.set('plan', plan)
        if (interval) params.set('interval', interval)
        redirectUrl = `/pricing?${params.toString()}`

    } else if (intent === 'view_pricing') {
        redirectUrl = '/api/auth-callback?signup_intent=view_pricing'
    }

    const handleGoogleSignUp = async () => {
        if (!isLoaded) return
        try {
            await signUp.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: redirectUrl,
            })
        } catch (err) {
            console.error("OAuth error", err)
        }
    }

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-[500px] bg-violet-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4">
                {programInfo ? (
                    <div className="text-center mb-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 mb-4 overflow-hidden">
                            {programInfo.logoUrl ? (
                                <img src={programInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Sparkles className="w-10 h-10 text-white" />
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">{programInfo.businessName}</h1>
                        <p className="text-gray-400 text-sm">Crea tu cuenta para acumular puntos</p>
                    </div>
                ) : (
                    <BrandLogo size="xl" className="mb-8 scale-110" />
                )}

                {view === 'selection' ? (
                    <div className="w-full bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl shadow-violet-900/20 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-white mb-6 text-center">Elige cómo registrarte</h2>

                        <div className="space-y-3">
                            {/* Google Button */}
                            <button
                                onClick={handleGoogleSignUp}
                                className="w-full h-14 bg-white hover:bg-gray-100 text-black font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Continuar con Google
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10"></span>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#111] px-2 text-gray-500">O usa otro método</span>
                                </div>
                            </div>

                            {/* Phone Button */}
                            <button
                                onClick={() => setView('form')}
                                className="w-full h-14 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                            >
                                <Phone className="w-5 h-5 text-[#00FF00] group-hover:text-[#00DD00] transition-colors" />
                                <span className="group-hover:text-gray-200">Usar teléfono</span>
                            </button>

                            {/* Email Button */}
                            <button
                                onClick={() => setView('form')}
                                className="w-full h-14 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                            >
                                <Mail className="w-5 h-5 text-[#00FF00] group-hover:text-[#00DD00] transition-colors" />
                                <span className="group-hover:text-gray-200">Usar correo electrónico</span>
                            </button>
                        </div>

                        <div className="mt-6 text-center">
                            <button onClick={() => window.history.back()} className="text-gray-500 hover:text-white text-sm transition-colors">
                                Volver
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in slide-in-from-right-4 duration-500">
                        <button
                            onClick={() => setView('selection')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors font-medium text-sm"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Elegir otro método
                        </button>

                        <SignUp
                            appearance={{
                                variables: {
                                    colorPrimary: '#00FF00',
                                    colorTextSecondary: '#00FF00'
                                },
                                elements: {
                                    rootBox: "w-full",
                                    card: "bg-[#111] border border-white/10 shadow-2xl shadow-violet-900/20 backdrop-blur-xl",
                                    headerTitle: programInfo ? "hidden" : "text-white font-bold text-xl",
                                    headerSubtitle: programInfo ? "hidden" : "text-gray-400",
                                    // Hide social buttons in form view since we have them in selection
                                    socialButtonsBlockButton: "hidden",
                                    dividerLine: "hidden",
                                    dividerText: "hidden",

                                    formFieldLabel: "text-gray-300",
                                    formFieldInput: "bg-black/50 border-white/10 text-white focus:border-violet-500 transition-colors",
                                    footerActionText: "text-gray-400",
                                    footerActionLink: "!text-[#00FF00] hover:!text-[#00DD00] font-bold"
                                }
                            }}
                            forceRedirectUrl={redirectUrl}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

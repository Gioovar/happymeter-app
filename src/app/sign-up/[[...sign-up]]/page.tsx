'use client'

import { SignUp, useSignUp } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicLoyaltyProgramInfo } from "@/actions/loyalty";
import { Sparkles, Mail, Phone, ArrowLeft, Loader2 } from "lucide-react";
// import { dark } from "@clerk/themes"; // Removing dark theme
import { esES } from "@clerk/localizations";

export default function Page() {
    const searchParams = useSearchParams()
    const intent = searchParams.get('intent')
    const plan = searchParams.get('plan')
    const interval = searchParams.get('interval')
    const finalRedirect = searchParams.get('redirect_url')
    const programId = searchParams.get('program_id')

    const [programInfo, setProgramInfo] = useState<any>(null)
    const [view, setView] = useState<'selection' | 'form' | 'phone_entry' | 'email_entry'>('selection')
    const [formValues, setFormValues] = useState<{ phoneNumber?: string; emailAddress?: string }>({})
    const [tempPhone, setTempPhone] = useState('')
    const [tempEmail, setTempEmail] = useState('')
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

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setFormValues({ phoneNumber: tempPhone })
        setView('form')
    }

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setFormValues({ emailAddress: tempEmail })
        setView('form')
    }

    return (
        <div className="min-h-screen bg-white grid lg:grid-cols-2">

            {/* Left Column - Image (Hidden on Mobile) */}
            <div className="hidden lg:block relative overflow-hidden bg-gray-100">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2670&auto=format&fit=crop"
                        alt="Office Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-violet-900/40 to-transparent mix-blend-multiply" />
                </div>

                <div className="absolute bottom-12 left-12 right-12 text-white">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold tracking-wide uppercase text-sm">HappyMeters</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-4 leading-tight">
                        Eleva la experiencia de tus clientes al siguiente nivel.
                    </h1>
                    <p className="text-lg text-gray-200">
                        Únete a las empresas que están transformando la satisfacción en crecimiento.
                    </p>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex flex-col items-center justify-center p-6 md:p-12 relative bg-white">

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 flex justify-center">
                        <BrandLogo variant="dark" size="lg" />
                    </div>

                    {/* Desktop Logo (Top Right of container if needed, or just keep minimal) */}
                    <div className="hidden lg:flex justify-end mb-12 absolute top-0 right-0">
                        {/* Optional top right placement, or just use form header */}
                    </div>


                    {view === 'selection' ? (
                        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Crear Cuenta</h2>
                                <p className="text-gray-500">Comienza tu prueba gratuita hoy</p>
                            </div>

                            <div className="space-y-4">
                                {/* Google Button */}
                                <button
                                    onClick={handleGoogleSignUp}
                                    className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-lg rounded-xl border border-gray-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-sm"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continuar con Google
                                </button>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-gray-200"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                        <span className="bg-white px-4 text-gray-400 font-semibold">o regístrate con</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => setView('phone_entry')}
                                        className="w-full h-12 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 font-medium rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                                    >
                                        <Phone className="w-4 h-4 text-gray-500 group-hover:text-violet-600 transition-colors" />
                                        <span>Teléfono</span>
                                    </button>

                                    <button
                                        onClick={() => setView('email_entry')}
                                        className="w-full h-12 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 font-medium rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                                    >
                                        <Mail className="w-4 h-4 text-gray-500 group-hover:text-violet-600 transition-colors" />
                                        <span>Correo electrónico</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-gray-500 text-sm">
                                    ¿Ya tienes cuenta?{' '}
                                    <a href={`/sign-in?intent=${intent || ''}&program_id=${programId || ''}&redirect_url=${finalRedirect || ''}`} className="text-violet-600 hover:underline font-semibold transition-colors">Inicia sesión</a>
                                </p>
                            </div>
                        </div>
                    ) : view === 'phone_entry' ? (
                        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
                            <button
                                onClick={() => setView('selection')}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium text-sm group"
                            >
                                <div className="p-2 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Volver
                            </button>

                            <div className="text-center lg:text-left mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingresa tu teléfono</h2>
                                <p className="text-gray-500">Te enviaremos un código de seguridad</p>
                            </div>

                            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-gray-700 font-medium ml-1 mb-1.5 text-sm">Número de teléfono</label>
                                    <input
                                        type="tel"
                                        placeholder="+52..."
                                        value={tempPhone}
                                        onChange={(e) => setTempPhone(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:bg-white h-12 rounded-xl px-4 text-lg outline-none transition-all placeholder:text-gray-400"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-violet-500/30"
                                >
                                    Continuar
                                </button>
                            </form>
                        </div>
                    ) : view === 'email_entry' ? (
                        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
                            <button
                                onClick={() => setView('selection')}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium text-sm group"
                            >
                                <div className="p-2 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Volver
                            </button>

                            <div className="text-center lg:text-left mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ingresa tu correo</h2>
                                <p className="text-gray-500">Te enviaremos un enlace de verificación</p>
                            </div>

                            <form onSubmit={handleEmailSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-gray-700 font-medium ml-1 mb-1.5 text-sm">Correo electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="ejemplo@correo.com"
                                        value={tempEmail}
                                        onChange={(e) => setTempEmail(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:bg-white h-12 rounded-xl px-4 text-lg outline-none transition-all placeholder:text-gray-400"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-violet-500/30"
                                >
                                    Continuar
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
                            <button
                                onClick={() => setView('selection')}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium text-sm group"
                            >
                                <div className="p-2 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Volver a opciones
                            </button>

                            <SignUp
                                initialValues={formValues}
                                // localization={esES} // Handled globally in layout.tsx
                                appearance={{
                                    // baseTheme: dark, // Removed Dark Theme
                                    layout: {
                                        socialButtonsPlacement: 'bottom',
                                        showOptionalFields: false,
                                    },
                                    variables: {
                                        colorPrimary: '#7c3aed', // violet-600
                                        colorText: '#111827', // gray-900
                                        colorTextSecondary: '#6b7280', // gray-500
                                        colorBackground: '#ffffff',
                                        borderRadius: '0.75rem',
                                    },
                                    elements: {
                                        rootBox: "w-full",
                                        card: "bg-transparent shadow-none p-0",
                                        headerTitle: "text-2xl font-bold text-gray-900 mb-2",
                                        headerSubtitle: "text-gray-500 text-base",

                                        socialButtonsBlockButton: "w-full h-12 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl",

                                        formFieldLabel: "text-gray-700 font-medium ml-1 mb-1.5",
                                        formFieldInput: "bg-gray-50 border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 h-12 rounded-xl transition-all",

                                        footerActionText: "text-gray-500",
                                        footerActionLink: "text-violet-600 hover:text-violet-700 font-bold"
                                    }
                                }}
                                forceRedirectUrl={redirectUrl}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

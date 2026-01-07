'use client'

import { SignIn, useSignIn } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicLoyaltyProgramInfo } from "@/actions/loyalty";
import { Sparkles, Phone, Mail, ArrowLeft } from "lucide-react";

export default function Page() {
    const { signIn, isLoaded } = useSignIn();
    const searchParams = useSearchParams()
    const intent = searchParams.get('intent')
    const finalRedirect = searchParams.get('redirect_url')
    const programId = searchParams.get('program_id')

    const [programInfo, setProgramInfo] = useState<any>(null)
    const [view, setView] = useState<'selection' | 'form' | 'phone_entry' | 'email_entry'>('selection')
    const [formValues, setFormValues] = useState<{ phoneNumber?: string; emailAddress?: string; identifier?: string }>({})
    const [tempPhone, setTempPhone] = useState('')
    const [tempEmail, setTempEmail] = useState('')

    useEffect(() => {
        if (programId) {
            getPublicLoyaltyProgramInfo(programId).then(setProgramInfo)
        }
    }, [programId])

    let redirectUrl = finalRedirect || '/api/auth-callback'

    if (intent === 'creator') {
        redirectUrl = '/api/auth-callback?signup_intent=creator'
    } else if (intent === 'view_pricing') {
        redirectUrl = '/api/auth-callback?signup_intent=view_pricing'
    }

    const handleGoogleSignIn = async () => {
        if (!isLoaded) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: redirectUrl,
            });
        } catch (err) {
            console.error("Error signing in with Google", err);
        }
    };

    const handlePhoneSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setFormValues({ phoneNumber: tempPhone })
        setView('form')
    }

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // We use 'identifier' or 'emailAddress' depending on what Clerk expects for the first step. 
        // Usually 'identifier' covers both username and email.
        setFormValues({ identifier: tempEmail })
        setView('form')
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] grid lg:grid-cols-2">

            {/* Left Column - Hero (Hidden on Mobile) */}
            <div className="hidden lg:flex flex-col relative justify-between p-12 bg-[#050505] overflow-hidden border-r border-white/5">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/20 blur-[150px] rounded-full mix-blend-screen pointer-events-none translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none -translate-x-1/3 translate-y-1/3" />

                {/* Top Branding */}
                <div className="relative z-10">
                    <BrandLogo />
                </div>

                {/* Center Content */}
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                        {programInfo ? (
                            <>
                                Bienvenido a <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                                    {programInfo.businessName}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="block text-4xl font-semibold text-white mb-2">
                                    Convierte opiniones en
                                </span>
                                <span className="block text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 drop-shadow-[0_0_15px_rgba(167,139,250,0.3)]">
                                    Crecimiento Real
                                </span>
                            </>
                        )}
                    </h1>
                    <p className="text-xl text-gray-400 leading-relaxed text-balance">
                        {programInfo
                            ? "Inicia sesión para ver tus puntos disponibles, canjear recompensas y descubrir nuevas promociones exclusivas."
                            : "Accede a tu panel de administración para monitorizar el feedback de tus clientes y gestionar tus campañas de lealtad."
                        }
                    </p>
                </div>

                {/* Bottom Stats/Trust */}
                <div className="relative z-10 flex items-center gap-8 text-sm font-medium text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Sistemas operativos</span>
                    </div>
                </div>
            </div>

            {/* Right Column - Form */}
            <div className="flex flex-col items-center justify-center p-6 md:p-12 relative">
                {/* Mobile Background Elements */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-[500px] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

                <div className="w-full max-w-md relative z-10">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 flex justify-center">
                        <BrandLogo size="lg" />
                    </div>

                    {view === 'selection' ? (
                        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center lg:text-left mb-8">
                                <h2 className="text-3xl font-bold text-white mb-2">Iniciar Sesión</h2>
                                <p className="text-gray-400">Elige cómo quieres acceder</p>
                            </div>

                            <div className="space-y-4">
                                {/* Google Button */}
                                <button
                                    onClick={handleGoogleSignIn}
                                    className="w-full h-16 bg-white hover:bg-gray-100 text-black font-bold text-lg rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
                                >
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Continuar con Google
                                </button>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-white/10"></span>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase tracking-widest">
                                        <span className="bg-[#0a0a0a] px-4 text-gray-500 font-semibold">O continuar con</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        onClick={() => setView('phone_entry')}
                                        className="w-full h-14 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                                    >
                                        <Phone className="w-5 h-5 text-[#00FF00] group-hover:text-[#00DD00] transition-colors" />
                                        <span className="group-hover:text-gray-200">Continuar con teléfono</span>
                                    </button>

                                    <button
                                        onClick={() => setView('email_entry')}
                                        className="w-full h-14 bg-[#1a1a1a] hover:bg-[#222] border border-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] group"
                                    >
                                        <Mail className="w-5 h-5 text-[#00FF00] group-hover:text-[#00DD00] transition-colors" />
                                        <span className="group-hover:text-gray-200">Continuar con correo electrónico</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-gray-500">
                                    ¿No tienes cuenta?{' '}
                                    <a href={`/sign-up?intent=${intent || ''}&program_id=${programId || ''}&redirect_url=${finalRedirect || ''}`} className="text-white hover:underline decoration-[#00FF00] font-medium">Regístrate</a>
                                </p>
                            </div>
                        </div>
                    ) : view === 'phone_entry' ? (
                        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
                            <button
                                onClick={() => setView('selection')}
                                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors font-medium text-sm group"
                            >
                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Volver
                            </button>

                            <div className="text-center lg:text-left mb-8">
                                <h2 className="text-3xl font-bold text-white mb-2">Introduce tu número</h2>
                                <p className="text-gray-400">Te enviaremos un código de seguridad</p>
                            </div>

                            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-gray-400 font-medium ml-1 mb-1.5 text-sm">Número de teléfono</label>
                                    <input
                                        type="tel"
                                        placeholder="+52..."
                                        value={tempPhone}
                                        onChange={(e) => setTempPhone(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 text-white focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00]/50 h-12 rounded-xl px-4 text-lg outline-none transition-all"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full h-12 bg-[#00FF00] hover:bg-[#00DD00] text-black font-bold rounded-xl transition-colors"
                                >
                                    Continuar
                                </button>
                            </form>
                        </div>
                    ) : view === 'email_entry' ? (
                        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
                            <button
                                onClick={() => setView('selection')}
                                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors font-medium text-sm group"
                            >
                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Volver
                            </button>

                            <div className="text-center lg:text-left mb-8">
                                <h2 className="text-3xl font-bold text-white mb-2">Introduce tu correo</h2>
                                <p className="text-gray-400">Te enviaremos un código de acceso</p>
                            </div>

                            <form onSubmit={handleEmailSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-gray-400 font-medium ml-1 mb-1.5 text-sm">Correo electrónico</label>
                                    <input
                                        type="email"
                                        placeholder="ejemplo@correo.com"
                                        value={tempEmail}
                                        onChange={(e) => setTempEmail(e.target.value)}
                                        className="w-full bg-[#111] border border-white/10 text-white focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00]/50 h-12 rounded-xl px-4 text-lg outline-none transition-all"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full h-12 bg-[#00FF00] hover:bg-[#00DD00] text-black font-bold rounded-xl transition-colors"
                                >
                                    Continuar
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="w-full animate-in fade-in slide-in-from-right-8 duration-500">
                            <button
                                onClick={() => setView('selection')}
                                className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors font-medium text-sm group"
                            >
                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                Volver a opciones
                            </button>

                            <SignIn
                                initialValues={formValues}
                                routing="path"
                                path="/sign-in"
                                signUpUrl={`/sign-up?redirect_url=${redirectUrl}`}
                                appearance={{
                                    variables: {
                                        colorPrimary: '#00FF00',
                                        colorTextSecondary: '#00FF00',
                                        colorBackground: 'transparent'
                                    },
                                    elements: {
                                        rootBox: "w-full",
                                        card: "bg-transparent shadow-none p-0 border-none",
                                        headerTitle: "hidden",
                                        headerSubtitle: "hidden",
                                        // Hide social buttons since we handle them in selection
                                        socialButtonsBlockButton: "hidden",
                                        dividerLine: "hidden",
                                        dividerText: "hidden",

                                        formFieldLabel: "text-gray-400 font-medium ml-1 mb-1.5",
                                        formFieldInput: "bg-[#111] border-white/10 text-white focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00]/50 h-12 rounded-xl transition-all",

                                        footerActionText: "text-gray-400",
                                        footerActionLink: "!text-[#00FF00] hover:!text-[#00DD00] font-bold",
                                        formFieldAction: "!text-[#00FF00] hover:!text-[#00DD00] font-bold",
                                        identityPreviewEditButton: "!text-[#00FF00] hover:!text-[#00DD00] font-bold",
                                        alternativeMethodsBlockButton: "!text-[#00FF00] hover:!text-[#00DD00] font-bold"
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

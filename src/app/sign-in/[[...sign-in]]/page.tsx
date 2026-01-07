'use client'

import { SignIn } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicLoyaltyProgramInfo } from "@/actions/loyalty";
import { Sparkles } from "lucide-react";

export default function Page() {
    const searchParams = useSearchParams()
    const intent = searchParams.get('intent')
    const finalRedirect = searchParams.get('redirect_url')
    const programId = searchParams.get('program_id')

    const [programInfo, setProgramInfo] = useState<any>(null)

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
                                Bienvenido <br />
                                <span className="text-white">de Nuevo</span>
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

                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white mb-2">Iniciar sesión o registrarse</h2>
                        <p className="text-gray-400">Introduce tus credenciales para continuar</p>
                    </div>

                    <SignIn
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
                                socialButtonsBlockButton: "bg-white text-black hover:bg-gray-100 border-none font-bold h-12 rounded-xl",
                                dividerLine: "bg-white/10",
                                dividerText: "text-gray-500 font-medium uppercase tracking-wider text-xs",

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
            </div>
        </div>
    );
}

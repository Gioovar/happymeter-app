'use client'

import { SignIn } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";
import { useSearchParams } from "next/navigation";

export default function Page() {
    const searchParams = useSearchParams()
    const intent = searchParams.get('intent')
    let redirectUrl = '/api/auth-callback'

    if (intent === 'creator') {
        redirectUrl = '/api/auth-callback?signup_intent=creator'
    } else if (intent === 'view_pricing') {
        redirectUrl = '/api/auth-callback?signup_intent=view_pricing'
    }

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-[500px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                <BrandLogo size="xl" className="mb-8 scale-110" />
                <SignIn
                    routing="path"
                    path="/sign-in"
                    signUpUrl={`/sign-up?redirect_url=${redirectUrl}`}
                    appearance={{
                        variables: {
                            colorPrimary: '#00FF00',
                            colorTextSecondary: '#00FF00'
                        },
                        elements: {
                            rootBox: "w-full",
                            card: "bg-[#111] border border-white/10 shadow-2xl shadow-violet-900/20 backdrop-blur-xl",
                            headerTitle: "text-white font-bold text-xl",
                            headerSubtitle: "text-gray-400",
                            socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all",
                            dividerLine: "bg-white/10",
                            dividerText: "text-gray-500",
                            formFieldLabel: "text-gray-300",
                            formFieldInput: "bg-black/50 border-white/10 text-white focus:border-violet-500 transition-colors",
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
    );
}

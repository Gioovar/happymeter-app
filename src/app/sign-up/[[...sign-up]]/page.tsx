'use client'

import { SignUp } from "@clerk/nextjs";
import BrandLogo from "@/components/BrandLogo";
import { useSearchParams } from "next/navigation";

export default function Page() {
    const searchParams = useSearchParams()
    const intent = searchParams.get('intent')
    const plan = searchParams.get('plan')
    const interval = searchParams.get('interval')

    let redirectUrl = '/api/auth-callback'

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

    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-[#0a0a0a] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-full h-[500px] bg-violet-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                <BrandLogo size="xl" className="mb-8 scale-110" />
                <SignUp
                    appearance={{
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
                            footerActionLink: "text-violet-400 hover:text-violet-300 font-bold"
                        }
                    }}
                    forceRedirectUrl={redirectUrl}
                />
            </div>
        </div>
    );
}

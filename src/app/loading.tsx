'use client'

import Image from 'next/image'

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]">
            {/* Pulsing Container */}
            <div className="relative flex flex-col items-center">

                {/* Logo Animation */}
                <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                    {/* Rotating Gradient Ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-violet-600 animate-spin-slow p-[2px]">
                        <div className="w-full h-full bg-[#0a0a0a] rounded-full" />
                    </div>

                    {/* Inner Glow */}
                    <div className="absolute inset-0 bg-green-500/10 blur-xl rounded-full" />

                    {/* Logo Asset */}
                    <Image
                        src="/assets/branding/logo-primary.png"
                        alt="HappyMeter Loading"
                        width={80}
                        height={80}
                        className="relative z-10 w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-pulse"
                        priority
                    />
                </div>

                {/* Text Logo */}
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                    Happy<span className="text-green-500">Meter</span>
                </h1>

                {/* Loading Bar */}
                <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 animate-loading-bar rounded-full" />
                </div>
            </div>

            <style jsx global>{`
                @keyframes loading-bar {
                    0% { width: 0%; margin-left: 0; }
                    50% { width: 60%; margin-left: 20%; }
                    100% { width: 100%; margin-left: 100%; }
                }
                .animate-loading-bar {
                    animation: loading-bar 1.5s infinite ease-in-out;
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
            `}</style>
        </div>
    )
}

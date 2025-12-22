'use client'

import Image from 'next/image'

export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a]">
            {/* Pulsing Container */}
            <div className="relative flex flex-col items-center">

                {/* Logo Animation */}
                <div className="relative w-24 h-24 mb-6 animate-pulse">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-violet-600/30 blur-3xl rounded-full" />

                    {/* Melting Smiley Asset - Using basic img for immediate render manually if needed, but Image is standard */}
                    <Image
                        src="/assets/icons/logo-outline-purple.png"
                        alt="HappyMeter Loading"
                        width={96}
                        height={96}
                        className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                        priority
                    />
                </div>

                {/* Text Logo */}
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                    Happy<span className="text-violet-500">Meter</span>
                </h1>

                {/* Loading Bar */}
                <div className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600 animate-loading-bar rounded-full" />
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
            `}</style>
        </div>
    )
}

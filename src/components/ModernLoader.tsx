'use client'

import { motion } from 'framer-motion'

interface ModernLoaderProps {
    text?: string
    className?: string
}

export default function ModernLoader({ text = "Procesando...", className = "" }: ModernLoaderProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
            {/* Main Loader Container */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">

                {/* 1. Core Pulsing Orb */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                        boxShadow: [
                            "0 0 20px rgba(139, 92, 246, 0.3)",
                            "0 0 40px rgba(139, 92, 246, 0.6)",
                            "0 0 20px rgba(139, 92, 246, 0.3)"
                        ]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute w-12 h-12 bg-violet-600 rounded-full blur-md z-10"
                />

                {/* 2. Inner Rotating Ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute w-20 h-20 rounded-full border-2 border-transparent border-t-fuchsia-500 border-r-fuchsia-500/50"
                />

                {/* 3. Outer Counter-Rotating Ring */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                    className="absolute w-28 h-28 rounded-full border border-violet-500/30 border-b-violet-500"
                />

                {/* 4. Orbiting Particles */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute w-full h-full"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
                </motion.div>

                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute w-24 h-24"
                >
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-fuchsia-400 rounded-full shadow-[0_0_8px_fuchsia]" />
                </motion.div>

                {/* Icon/Logo Center */}
                <div className="relative z-20 w-8 h-8">
                    <svg
                        viewBox="0 0 24 24"
                        className="w-full h-full text-white fill-current"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" opacity="0" />
                        <path d="M9.5 13.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5S11.83 12 11 12s-1.5.67-1.5 1.5zm-4 0c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5S7.83 12 7 12s-1.5.67-1.5 1.5zm11 1.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" opacity="0.9" />
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.68.79 4.94 2.06l-1.41 1.41C14.68 8.63 13.41 8 12 8c-2.76 0-5 2.24-5 5s2.24 5 5 5c1.41 0 2.68-.63 3.53-1.47l1.41 1.41A6.976 6.976 0 0019 13c0-3.87-3.13-7-7-7z" fill="white" />
                    </svg>
                </div>
            </div>

            {/* Loading Text with Gradient Animation */}
            <div className="text-center space-y-2">
                <h3 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-200 to-white animate-gradient bg-300%">
                    {text}
                </h3>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-violet-300/60 max-w-xs mx-auto"
                >
                    Esto puede tomar unos segundos mientras HappyMeter AI 2.0 Gemini procesa el feedback.
                </motion.p>
            </div>

            <style jsx global>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 3s ease infinite;
                }
                .bg-300\% {
                    background-size: 300% 300%;
                }
            `}</style>
        </div>
    )
}

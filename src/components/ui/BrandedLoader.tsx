'use client'

import Image from 'next/image'

export default function BrandedLoader({ text = "Cargando..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full animate-in fade-in duration-300">
            <div className="relative w-24 h-24 mb-6">
                {/* Glowing Ring */}
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />

                {/* Logo */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <Image
                        src="/happy-ai-logo.png"
                        alt="Loading..."
                        width={64}
                        height={64}
                        className="w-full h-full object-contain animate-pulse"
                    />
                </div>
            </div>
            <p className="text-gray-400 font-medium text-sm animate-pulse">{text}</p>
        </div>
    )
}

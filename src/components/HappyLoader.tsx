import Image from 'next/image'

interface HappyLoaderProps {
    text?: string
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export default function HappyLoader({ text = "Procesando Datos...", className = "", size = 'md' }: HappyLoaderProps) {
    // Size maps
    const containerSizes = {
        sm: "w-16 h-16",
        md: "w-24 h-24",
        lg: "w-32 h-32"
    }

    const imageSizes = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16"
    }

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div className={`relative ${containerSizes[size]} flex items-center justify-center mb-4`}>
                {/* Outer Ring - Slow spin */}
                <div className="absolute inset-0 rounded-full border-[3px] border-violet-500/20 border-t-violet-500 animate-[spin_3s_linear_infinite]" />

                {/* Middle Ring - Medium spin reverse */}
                <div className="absolute inset-2 rounded-full border-[3px] border-fuchsia-500/20 border-b-fuchsia-500 animate-[spin_2s_linear_infinite_reverse]" />

                {/* Inner Glow */}
                <div className="absolute inset-4 rounded-full bg-violet-500/10 animate-pulse" />

                {/* Logo */}
                <div className={`relative ${imageSizes[size]} animate-pulse`}>
                    <img
                        src="/assets/icons/bot-avatar-purple.png"
                        alt="Loading..."
                        className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    />
                </div>
            </div>

            <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-300% animate-gradient text-center">
                {text}
            </h3>
        </div>
    )
}

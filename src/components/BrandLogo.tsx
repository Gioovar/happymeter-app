import Image from 'next/image'
import Link from 'next/link'

interface BrandLogoProps {
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    withText?: boolean
    textClassName?: string
}

export default function BrandLogo({
    className = "",
    size = 'md',
    withText = true,
    textClassName = ""
}: BrandLogoProps) {

    const sizeMap = {
        sm: { w: 24, h: 24, text: 'text-lg' },
        md: { w: 32, h: 32, text: 'text-xl' },
        lg: { w: 40, h: 40, text: 'text-2xl' },
        xl: { w: 48, h: 48, text: 'text-3xl' }
    }

    const currentSize = sizeMap[size]

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="relative animate-[pulse_4s_ease-in-out_infinite] hover:animate-[spin_1s_ease-in-out]">
                {/* Glow user liked */}
                {/* Glow user liked */}
                <div className="absolute inset-0 bg-green-500/20 blur-lg rounded-full" />

                <Image
                    src="/assets/branding/logo-primary.png"
                    alt="HappyMeter Logo"
                    width={currentSize.w}
                    height={currentSize.h}
                    className="object-contain relative z-10 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                />
            </div>

            {withText && (
                <span className={`font-bold tracking-tight text-white ${currentSize.text} ${textClassName}`}>
                    Happy<span className="text-green-500">Meter</span>
                </span>
            )}
        </div>
    )
}

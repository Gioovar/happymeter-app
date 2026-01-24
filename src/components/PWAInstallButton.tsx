'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

export default function PWAInstallButton({ className }: { className?: string }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
        }

        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handler)

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()

        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setIsInstalled(true)
        }
    }

    if (isInstalled || !deferredPrompt) return null

    return (
        <button
            onClick={handleInstallClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white shadow-md hover:bg-white/20 transition-all ${className}`}
        >
            <Download className="w-4 h-4" />
            <div className="flex flex-col items-start">
                <span className="text-[10px] font-medium text-white/80 uppercase leading-none">Disponible</span>
                <span className="text-xs font-bold leading-tight">Instalar App</span>
            </div>
        </button>
    )
}

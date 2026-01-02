"use client"

import { useState, useEffect } from "react"
import { Download, Share, PlusSquare, X } from "lucide-react"
import { toast } from "sonner"
import { createPortal } from "react-dom"

export function InstallPwa() {
    const [supportsPWA, setSupportsPWA] = useState(false)
    const [promptInstall, setPromptInstall] = useState<any>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [showIOSInstructions, setShowIOSInstructions] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        // Check if already installed/standalone
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
        setIsStandalone(isStandaloneMode)
        if (isStandaloneMode) return

        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase()
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
        setIsIOS(isIosDevice)

        // Check for Android/Desktop install prompt
        const handler = (e: any) => {
            e.preventDefault()
            setPromptInstall(e)
            setSupportsPWA(true)
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstallClick = (e: any) => {
        e.preventDefault()
        if (isIOS) {
            setShowIOSInstructions(true)
        } else if (promptInstall) {
            promptInstall.prompt()
        } else {
            // Fallback for when we can't trigger prompt but want to guide
            toast.info("Para instalar: Busca la opción 'Instalar aplicación' en el menú de tu navegador.")
        }
    }

    if (isStandalone) return null // Don't show if already in app mode
    if (!supportsPWA && !isIOS) return null // Don't show if simple browser without support (unless iOS which is manual)

    return (
        <>
            <button
                onClick={handleInstallClick}
                className="w-full bg-[#1a1a24] border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white p-4 rounded-2xl flex items-center justify-center gap-3 transition-all mb-6"
            >
                <Download className="w-5 h-5 text-violet-400" />
                <span className="font-medium">Instalar App en mi Celular</span>
            </button>

            {/* iOS Instructions Modal */}
            {showIOSInstructions && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowIOSInstructions(false)} />
                    <div className="relative w-full max-w-md bg-[#18181b] border-t border-white/10 rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Instalar App</h3>
                                <p className="text-gray-400 text-sm">Sigue estos pasos para agregarla a tu inicio:</p>
                            </div>
                            <button onClick={() => setShowIOSInstructions(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl text-blue-400">
                                    <Share className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white font-medium mb-1">1. Toca el botón Compartir</p>
                                    <p className="text-xs text-gray-500">Busca el icono <Share className="w-3 h-3 inline mx-1" /> en la barra inferior de Safari.</p>
                                </div>
                            </div>

                            <div className="w-[1px] h-4 bg-white/10 ml-8" />

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-xl text-gray-200">
                                    <PlusSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-white font-medium mb-1">2. Agregar a Inicio</p>
                                    <p className="text-xs text-gray-500">Desliza hacia abajo y selecciona "Agregar a Inicio".</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10 text-center">
                            <button onClick={() => setShowIOSInstructions(false)} className="text-violet-400 font-bold text-sm hover:underline">
                                ¡Entendido!
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

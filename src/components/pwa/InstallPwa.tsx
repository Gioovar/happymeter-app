"use client"

import { useState, useEffect } from "react"
import { Download, Share, PlusSquare, X } from "lucide-react"
import { toast } from "sonner"
import { createPortal } from "react-dom"

interface InstallPwaProps {
    mode?: "button" | "modal"
    isOpen?: boolean
    onClose?: () => void
}

export function InstallPwa({ mode = "button", isOpen = false, onClose }: InstallPwaProps) {
    const [supportsPWA, setSupportsPWA] = useState(false)
    const [promptInstall, setPromptInstall] = useState<any>(null)
    const [isIOS, setIsIOS] = useState(false)
    const [showIOSInstructions, setShowIOSInstructions] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
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
            if (onClose && mode === "modal") {
                // Keep modal open or close? 
                // We need to show iOS instructions. If we close the portal, we lose instructions.
                // So we will just show instructions on top or replace content.
                // For simplicity, let's keep the modal structure but show instructions.
            }
        } else if (promptInstall) {
            promptInstall.prompt()
            // optionally wait for result
            promptInstall.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    // User accepted
                    if (onClose) onClose()
                }
                setPromptInstall(null)
            })
        } else {
            // Fallback
            toast.info("Para instalar: Busca la opción 'Instalar aplicación' en el menú de tu navegador.")
        }
    }

    if (!mounted) return null
    if (isStandalone) return null

    const renderIOSInstructions = () => (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowIOSInstructions(false)} />
            <div className="relative w-full max-w-md bg-[#18181b] border-t border-white/10 rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 m-auto sm:m-0 bottom-0 sm:bottom-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">Instalar en iPhone</h3>
                        <p className="text-gray-400 text-sm">Sigue estos pasos:</p>
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
                            <p className="text-white font-medium mb-1">1. Toca "Compartir"</p>
                            <p className="text-xs text-gray-500">Icono <Share className="w-3 h-3 inline mx-1" /> en la barra inferior.</p>
                        </div>
                    </div>

                    <div className="w-[1px] h-4 bg-white/10 ml-8" />

                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white/5 rounded-xl text-gray-200">
                            <PlusSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white font-medium mb-1">2. Agregar a Inicio</p>
                            <p className="text-xs text-gray-500">Selecciona "Agregar a Inicio".</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <button onClick={() => setShowIOSInstructions(false)} className="text-violet-400 font-bold text-sm hover:underline">
                        ¡Entendido!
                    </button>
                </div>
            </div>
        </div>
    )

    // BUTTON MODE (Default)
    if (mode === "button") {
        if (!supportsPWA && !isIOS) return null

        return (
            <>
                <button
                    onClick={handleInstallClick}
                    className="w-full bg-[#1a1a24] border border-white/10 hover:bg-white/5 text-gray-300 hover:text-white p-4 rounded-2xl flex items-center justify-center gap-3 transition-all mb-6"
                >
                    <Download className="w-5 h-5 text-violet-400" />
                    <span className="font-medium">Instalar App en mi Celular</span>
                </button>
                {showIOSInstructions && createPortal(renderIOSInstructions(), document.body)}
            </>
        )
    }

    // MODAL MODE
    if (mode === "modal" && isOpen) {
        if (!supportsPWA && !isIOS) return null

        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
                <div className="relative w-full max-w-sm bg-[#18181b] border border-violet-500/20 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom zoom-in-95 duration-300 m-auto">

                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/20 rotate-3">
                            <Download className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">¡Instala la App!</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Obtén acceso rápido a tus recompensas y puntos agregando esta tarjeta a tu inicio.
                        </p>
                    </div>

                    <button
                        onClick={handleInstallClick}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-100 transition-all active:scale-95 mb-4 flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Download className="w-5 h-5" />
                        Instalar Ahora
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full text-gray-500 font-medium text-sm hover:text-white transition-colors"
                    >
                        Quizás después
                    </button>
                </div>
                {showIOSInstructions && renderIOSInstructions()}
            </div>,
            document.body
        )
    }

    return null
}

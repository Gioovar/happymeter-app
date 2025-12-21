'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { QrCode, Upload, Settings, Info, Edit3 } from 'lucide-react'
import BrandLogo from '@/components/BrandLogo'

interface GameContainerProps {
    title: string
    description: string
    children: React.ReactNode
    onGenerateQR: () => void
    customSettings?: React.ReactNode
    bannerUrl?: string
    onBannerUpload?: (file: File) => void
    onTitleChange?: (newTitle: string) => void
    onSave?: () => void
    isSaving?: boolean
    onBannerChange?: (dataUrl: string) => void
}

export default function GameContainer(props: GameContainerProps) {
    const {
        title,
        description,
        children,
        onGenerateQR,
        customSettings,
        bannerUrl: externalBannerUrl,
        onBannerUpload,
        onTitleChange,
        onSave,
        isSaving
    } = props
    const [internalBannerUrl, setInternalBannerUrl] = useState<string | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const bannerInputRef = useRef<HTMLInputElement>(null)

    const bannerUrl = externalBannerUrl || internalBannerUrl

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const result = reader.result as string
                setInternalBannerUrl(result)
                // Propagate the data URL if onBannerUpload expects a file, we might need a new prop for DataURL
                // But for now, let's reuse onBannerUpload if it can handle it, or add onBannerChange
                if (onBannerUpload) {
                    onBannerUpload(file)
                    // @ts-ignore - Quick fix to pass dataURL up if the parent wants it
                    if (props.onBannerChange) props.onBannerChange(result)
                } else if ((props as any).onBannerChange) {
                    (props as any).onBannerChange(result)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const triggerBannerUpload = () => {
        bannerInputRef.current?.click()
    }

    return (
        <div className="w-full flex justify-center p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Hidden Input */}
            <input
                type="file"
                ref={bannerInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {/* Editor Mode Warning (Mobile only or condensed) */}
            <div className="w-full max-w-6xl mb-6 md:hidden">
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                    <Info className="w-4 h-4 text-indigo-400 mt-0.5" />
                    <p className="text-xs text-indigo-200">
                        Modo Editor: Diseña tu juego aquí. Publica para obtener el QR.
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl items-start justify-center">

                {/* LEFT PANEL: Editor Controls */}
                <div className="w-full lg:w-1/3 space-y-6">

                    {/* 1. Header & Publish */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-2">Panel de Edición</h2>
                        <p className="text-gray-400 text-sm mb-6">
                            Personaliza la experiencia para tus clientes.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={onGenerateQR}
                                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-violet-500/20"
                            >
                                <QrCode className="w-5 h-5" /> Publicar y Obtener QR
                            </button>

                            {onSave && (
                                <button
                                    onClick={onSave}
                                    disabled={isSaving}
                                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-medium flex items-center justify-center gap-2 transition border border-white/5"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Settings className="w-4 h-4" />
                                    )}
                                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 2. Basic Info (Title & Banner) */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 space-y-6">
                        {/* Title Edit */}
                        <div>
                            <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                                <span className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Edit3 className="w-5 h-5" /></span>
                                Nombre del Juego
                            </h3>
                            {onTitleChange ? (
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => onTitleChange(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition font-medium"
                                    placeholder="Ej. Ruleta Loca"
                                />
                            ) : (
                                <p className="text-white font-medium pl-2">{title}</p>
                            )}
                        </div>

                        <div className="w-full h-px bg-white/5" />

                        {/* Banner Config */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-pink-500/10 rounded-lg">
                                    <Upload className="w-5 h-5 text-pink-500" />
                                </div>
                                <h3 className="font-bold text-white">Banner / Logo</h3>
                            </div>

                            <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                Sube tu banner o logo. Si no tienes uno, ¡no te preocupes!
                                Lo podrás agregar después. Por defecto mostramos una animación divertida.
                            </p>

                            <button
                                onClick={triggerBannerUpload}
                                className="text-sm font-semibold text-pink-400 hover:text-pink-300 underline underline-offset-4 decoration-pink-500/30"
                            >
                                + Subir imagen ahora
                            </button>
                        </div>
                    </div>

                    {/* 3. Game Rules (Injected) */}
                    {customSettings && (
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                            {customSettings}
                        </div>
                    )}
                </div>


                {/* RIGHT PANEL: Game Preview (Phone Mockup) */}
                <div className="w-full lg:w-[420px] shrink-0 sticky top-4">
                    <div className="text-center mb-4">
                        <span className="bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Vista Previa del Cliente (Móvil)
                        </span>
                    </div>

                    {/* Phone Mockup Frame */}
                    <div className="w-full bg-[#050505] border border-white/10 rounded-[3rem] p-4 shadow-2xl relative overflow-hidden ring-8 ring-[#1a1a1a] aspect-[9/19] flex flex-col">

                        {/* Phone Status Bar Simulation */}
                        <div className="h-6 w-full flex justify-between px-4 items-center mb-2 opacity-30">
                            <div className="text-[10px] text-white font-bold">9:41</div>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-full border border-white" />
                                <div className="w-3 h-3 rounded-full border border-white" />
                            </div>
                        </div>

                        {/* Custom Banner Area (Preview) */}
                        <div
                            onClick={triggerBannerUpload}
                            className={`w-full h-32 shrink-0 rounded-2xl relative overflow-hidden cursor-pointer group border border-white/10 mb-4 ${!bannerUrl ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 animate-gradient-x' : 'bg-white/5'}`}
                        >
                            {bannerUrl ? (
                                <div className="relative w-full h-full">
                                    <Image src={bannerUrl} alt="Game Banner" fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center relative">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 mix-blend-overlay" />
                                    <div className="z-10 flex flex-col items-center transform group-hover:scale-105 transition-transform duration-300">
                                        <BrandLogo size="lg" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Game Title */}
                        <div className="text-center mb-4 px-2 shrink-0">
                            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 break-words leading-tight">
                                {title}
                            </h1>
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">{description}</p>
                        </div>

                        {/* Main Game Content - Scrollable area */}
                        <div className="flex-1 overflow-y-auto no-scrollbar relative w-full">
                            {children}
                        </div>

                        {/* Phone Home Indicator */}
                        <div className="h-1 w-24 bg-white/20 rounded-full mx-auto mt-4 shrink-0" />
                    </div>
                </div>
            </div>
        </div>
    )
}

"use client"

import { Button } from "@/components/ui/button"
import { Share2, Download, Printer, Smartphone, ExternalLink, X } from "lucide-react"
import { useState, useRef } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog"
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'

interface ReservationLinkButtonProps {
    programId: string
    className?: string
}

export function ReservationLinkButton({ programId, className }: ReservationLinkButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [format, setFormat] = useState<'mobile' | 'print'>('mobile')
    const [isDownloading, setIsDownloading] = useState(false)
    const previewRef = useRef<HTMLDivElement>(null)

    // Ensure we are client-side for window access
    const getLink = () => {
        if (typeof window === 'undefined') return ''
        return `${window.location.origin}/book/${programId}`
    }

    const reservationLink = getLink()

    const handleDownload = async () => {
        if (!previewRef.current) return
        setIsDownloading(true)

        try {
            const canvas = await html2canvas(previewRef.current, {
                scale: 2, // Retína quality
                backgroundColor: null,
                useCORS: true
            })

            const image = canvas.toDataURL("image/png")
            const link = document.createElement("a")
            link.href = image
            link.download = `happymeter-qr-${format}.png`
            link.click()

            toast.success("Imagen descargada", {
                description: "Lista para compartir."
            })
        } catch (error) {
            console.error("Download error:", error)
            toast.error("Error al descargar la imagen")
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={`gap-2 border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700 hover:text-white ${className}`}
                >
                    <Share2 className="w-4 h-4 text-zinc-400" />
                    Compartir Link
                </Button>
            </DialogTrigger>

            {/* Custom tailored content matching the reference */}
            <DialogContent className="max-w-4xl bg-[#09090b] border-zinc-800 text-white p-0 gap-0 overflow-hidden sm:rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Smartphone className="w-5 h-5 text-indigo-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Descargar Código QR</h2>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row h-[600px]">
                    {/* Left: Preview Area (Darker bg) */}
                    <div className="flex-1 bg-[#0c0c0e] flex items-center justify-center p-8 relative overflow-hidden">
                        {/* The Capture Container */}
                        <div className="relative shadow-2xl shadow-black/50 transition-all duration-300 transform hover:scale-[1.02]">

                            {/* RENDER PREVIEW BASED ON FORMAT */}
                            <div
                                ref={previewRef}
                                className={`relative overflow-hidden flex flex-col items-center justify-center transition-all duration-500 ${format === 'mobile'
                                        ? 'w-[300px] h-[533px] bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#ec4899]' // Mobile Vertical
                                        : 'w-[400px] h-[300px] bg-white text-black' // Print Card
                                    }`}
                            >
                                {/* Mobile Design */}
                                {format === 'mobile' && (
                                    <>
                                        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                                        <div className="z-10 text-center space-y-6 p-6">
                                            <h3 className="text-white font-bold text-2xl drop-shadow-md">
                                                ¡Tu opinión nos importa!
                                            </h3>

                                            <div className="bg-white p-4 rounded-3xl shadow-xl mx-auto">
                                                <QRCodeSVG
                                                    value={reservationLink}
                                                    size={180}
                                                    level={"H"}
                                                    includeMargin={false}
                                                    fgColor="#000000"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-white/90 text-sm font-medium tracking-wide bg-black/20 py-1 px-4 rounded-full inline-block backdrop-blur-sm">
                                                    Escanea para Reservar
                                                </p>
                                            </div>
                                        </div>
                                        {/* Bottom branding */}
                                        <div className="absolute bottom-6 left-0 w-full text-center">
                                            <p className="text-white/60 text-[10px] uppercase tracking-widest">HappyMeter</p>
                                        </div>
                                    </>
                                )}

                                {/* Print Design */}
                                {format === 'print' && (
                                    <div className="flex flex-row items-center gap-8 p-8 border-4 border-black m-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]">
                                        <div className="bg-black p-2">
                                            <QRCodeSVG
                                                value={reservationLink}
                                                size={150}
                                                level={"H"}
                                                fgColor="#FFFFFF"
                                                bgColor="#000000"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2 text-left">
                                            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">
                                                Reserva<br />Aquí
                                            </h3>
                                            <p className="text-sm font-medium text-gray-600">
                                                Escanea el código con tu cámara para asegurar tu lugar.
                                            </p>
                                            <div className="pt-2">
                                                <p className="text-xs text-gray-400 font-mono">{reservationLink.replace('https://', '')}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        <p className="absolute bottom-4 text-zinc-500 text-xs font-medium">
                            Vista Previa ({format === 'mobile' ? 'Celular' : 'Impresión'})
                        </p>
                    </div>

                    {/* Right: Controls Area */}
                    <div className="w-full md:w-[400px] bg-[#09090b] border-l border-zinc-800 p-8 flex flex-col gap-6">

                        {/* Format Toggle */}
                        <div className="grid grid-cols-2 p-1 bg-zinc-900 rounded-lg border border-zinc-800">
                            <button
                                onClick={() => setFormat('mobile')}
                                className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${format === 'mobile'
                                        ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                            >
                                <Smartphone className="w-4 h-4" />
                                Para Celular
                            </button>
                            <button
                                onClick={() => setFormat('print')}
                                className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${format === 'print'
                                        ? 'bg-white text-black shadow-lg'
                                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                            >
                                <Printer className="w-4 h-4" />
                                Para Impresión
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex gap-3">
                                <div className="text-blue-400 mt-0.5">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-blue-100">
                                        {format === 'mobile' ? 'Formato Historia / Estado' : 'Formato de Mesa / Mostrador'}
                                    </p>
                                    <p className="text-xs text-blue-200/70 leading-relaxed">
                                        {format === 'mobile'
                                            ? 'Diseño vertical (1080×1920px) listo para compartir en Instagram Stories, WhatsApp Status o enviar por chat.'
                                            : 'Diseño de alto contraste ideal para imprimir en stickers, tent cards o carteles para tu local.'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto space-y-4">
                            <Button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="w-full h-12 bg-white text-black hover:bg-zinc-200 font-bold text-base rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02]"
                            >
                                {isDownloading ? (
                                    <span className="animate-pulse">Generando...</span>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5 mr-2" />
                                        Descargar Imagen
                                    </>
                                )}
                            </Button>

                            <button
                                onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent(reservationLink), '_blank')}
                                className="w-full flex items-center justify-center gap-2 text-zinc-500 hover:text-white text-sm py-2 transition-colors"
                            >
                                <span>¿Cómo usar estos códigos? Ver guía</span>
                                <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

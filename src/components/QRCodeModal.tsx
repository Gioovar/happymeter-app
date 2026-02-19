'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Download, Smartphone, Printer, HelpCircle, ExternalLink, Copy } from 'lucide-react'
import QRCode from 'qrcode'
import Link from 'next/link'
import { toast } from 'sonner'

interface QRCodeModalProps {
    isOpen: boolean
    onClose: () => void
    surveyUrl: string
    surveyTitle: string
}

export default function QRCodeModal({ isOpen, onClose, surveyUrl, surveyTitle }: QRCodeModalProps) {
    const [qrDataUrl, setQrDataUrl] = useState<string>('')
    const [activeTab, setActiveTab] = useState<'mobile' | 'print'>('mobile')
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        if (isOpen && surveyUrl) {
            QRCode.toDataURL(surveyUrl, { width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
                .then(url => setQrDataUrl(url))
                .catch(err => console.error(err))
        }
    }, [isOpen, surveyUrl])

    const handleDownloadMobile = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx || !qrDataUrl) return

        // Set canvas size for mobile (e.g., 1080x1920 story format)
        canvas.width = 1080
        canvas.height = 1920

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 0, 1920)
        gradient.addColorStop(0, '#8b5cf6') // Violet
        gradient.addColorStop(1, '#4c1d95') // Dark Violet
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 1080, 1920)

        // Text
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'

        // Title
        ctx.font = 'bold 80px Inter, sans-serif'
        ctx.fillText('¡Tu opinión nos importa!', 540, 400)

        // Subtitle
        ctx.font = '50px Inter, sans-serif'
        ctx.fillText('Ayúdanos a mejorar escaneando este código', 540, 500)

        // QR Code Image
        const img = new Image()
        img.onload = () => {
            // Draw white background for QR
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.roundRect(140, 640, 800, 800, 50)
            ctx.fill()

            // Draw QR
            ctx.drawImage(img, 190, 690, 700, 700)

            // Footer
            ctx.fillStyle = '#ffffff'
            ctx.font = '40px Inter, sans-serif'
            ctx.fillText(surveyTitle, 540, 1600)

            // Trigger Download
            const link = document.createElement('a')
            link.download = `encuesta-movil-${surveyTitle.replace(/\s+/g, '-').toLowerCase()}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
        }
        img.src = qrDataUrl
    }

    const handleDownloadPrint = () => {
        const link = document.createElement('a')
        link.download = `qr-limpio-${surveyTitle.replace(/\s+/g, '-').toLowerCase()}.png`
        link.href = qrDataUrl
        link.click()
    }

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(surveyUrl)
        toast.success("Enlace copiado al portapapeles")
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-violet-500" />
                        Descargar Código QR
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Preview Area */}
                    <div className="flex flex-col items-center justify-center bg-white/5 rounded-xl p-6 border border-white/5">
                        {activeTab === 'mobile' ? (
                            <div className="aspect-[9/16] w-48 bg-gradient-to-b from-violet-600 to-indigo-900 rounded-lg flex flex-col items-center justify-center p-4 text-center shadow-lg border-4 border-black">
                                <p className="text-[8px] font-bold text-white mb-2 leading-tight">¡Tu opinión nos importa!</p>
                                <div className="bg-white p-1 rounded mb-2">
                                    {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-24 h-24" />}
                                </div>
                                <p className="text-[6px] text-white opacity-80">{surveyTitle}</p>
                            </div>
                        ) : (
                            <div className="w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center shadow-lg">
                                {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-full h-full" />}
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-4">Vista Previa ({activeTab === 'mobile' ? 'Celular' : 'Impresión'})</p>
                    </div>

                    {/* Controls */}
                    <div className="space-y-6">

                        {/* Tabs */}
                        <div className="flex bg-white/5 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab('mobile')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === 'mobile' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Smartphone className="w-4 h-4" /> Para Celular
                            </button>
                            <button
                                onClick={() => setActiveTab('print')}
                                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 ${activeTab === 'print' ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Printer className="w-4 h-4" /> Para Impresión
                            </button>
                        </div>

                        {/* Info */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <h4 className="text-blue-400 font-bold text-sm mb-1 flex items-center gap-2">
                                <HelpCircle className="w-4 h-4" />
                                {activeTab === 'mobile' ? 'Formato Historia / Estado' : 'Formato Limpio (PNG)'}
                            </h4>
                            <p className="text-xs text-gray-300">
                                {activeTab === 'mobile'
                                    ? 'Diseño vertical (1080x1920px) listo para compartir en Instagram Stories, WhatsApp Status o enviar por chat.'
                                    : 'Código QR en alta resolución sobre fondo blanco, ideal para que tu diseñador lo incluya en menús, flyers o tarjetas.'
                                }
                            </p>
                        </div>

                        {/* Action */}
                        <button
                            onClick={activeTab === 'mobile' ? handleDownloadMobile : handleDownloadPrint}
                            className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition shadow-lg flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            {activeTab === 'mobile' ? 'Descargar Imagen' : 'Descargar PNG'}
                        </button>

                        <button
                            onClick={handleCopyUrl}
                            className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition flex items-center justify-center gap-2"
                        >
                            <Copy className="w-5 h-5" />
                            Copiar Enlace
                        </button>

                        <Link href="/dashboard/help/qr" className="block text-center">
                            <span className="text-xs text-gray-500 hover:text-violet-400 transition flex items-center justify-center gap-1">
                                ¿Cómo usar estos códigos? Ver guía <ExternalLink className="w-3 h-3" />
                            </span>
                        </Link>

                    </div>
                </div>
            </div>
        </div>
    )
}

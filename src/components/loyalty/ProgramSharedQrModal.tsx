"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, Share2, X, Printer, FileDown } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ProgramSharedQrModalProps {
    isOpen: boolean
    onClose: () => void
    programName: string
    programType: "Visits" | "Points"
    programUrl: string
}

export function ProgramSharedQrModal({ isOpen, onClose, programName, programType, programUrl }: ProgramSharedQrModalProps) {
    const qrRef = useRef<SVGSVGElement>(null)
    const [downloadMode, setDownloadMode] = useState<"mobile" | "print">("mobile")

    const handleDownload = () => {
        if (!qrRef.current) return

        const svgData = new XMLSerializer().serializeToString(qrRef.current)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()

        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
            if (!ctx) return

            if (downloadMode === "mobile") {
                // --- MOBILE FORMAT (Story 9:16) ---
                canvas.width = 1080
                canvas.height = 1920

                // Gradient Background
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
                gradient.addColorStop(0, "#8B5CF6") // Violet-500
                gradient.addColorStop(1, "#D946EF") // Fuchsia-500
                ctx.fillStyle = gradient
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                // Text
                ctx.fillStyle = "white"
                ctx.font = "bold 80px sans-serif"
                ctx.textAlign = "center"
                ctx.fillText(programName, canvas.width / 2, 400)

                ctx.font = "50px sans-serif"
                ctx.fillText(programType === "Visits" ? "Lealtad por Visitas" : "Lealtad por Puntos", canvas.width / 2, 500)

                // QR Code (Center)
                // Draw a white rounded rect behind QR for contrast
                ctx.fillStyle = "white"
                roundRect(ctx, (canvas.width - 660) / 2, (canvas.height - 660) / 2, 660, 660, 40)
                ctx.fill()

                ctx.drawImage(img, (canvas.width - 600) / 2, (canvas.height - 600) / 2, 600, 600)

                // CTA
                ctx.fillStyle = "white"
                ctx.font = "bold 40px sans-serif"
                ctx.fillText("ESCANEA PARA UNIRTE", canvas.width / 2, 1400)

            } else {
                // --- PRINT FORMAT (Clean High-Res) ---
                canvas.width = 2048
                canvas.height = 2400

                // White Background
                ctx.fillStyle = "#ffffff"
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                // QR Code (Large & Central)
                ctx.drawImage(img, (canvas.width - 1500) / 2, (canvas.height - 1500) / 2 - 100, 1500, 1500)

                // Label at bottom
                ctx.fillStyle = "black"
                ctx.font = "bold 80px sans-serif"
                ctx.textAlign = "center"
                ctx.fillText(programName, canvas.width / 2, 2000)

                ctx.fillStyle = "#666666"
                ctx.font = "50px sans-serif"
                ctx.fillText(programType === "Visits" ? "Programa de Lealtad (Visitas)" : "Programa de Lealtad (Puntos)", canvas.width / 2, 2100)
            }

            // Trigger Download
            const pngUrl = canvas.toDataURL("image/png")
            const downloadLink = document.createElement("a")
            downloadLink.href = pngUrl
            downloadLink.download = `${programName}-${downloadMode === "mobile" ? "Story" : "Print"}.png`
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
            URL.revokeObjectURL(url)
            toast.success(`Código QR descargado (${downloadMode === "mobile" ? "Móvil" : "Impresión"})`)
        }

        img.src = url
    }

    // Helper for rounded rects on canvas
    const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-[#0a0a0f] border-white/10 p-0 overflow-hidden flex flex-col md:flex-row gap-0">

                {/* PREVIEW SECTION */}
                <div className={cn(
                    "flex-1 p-12 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[500px] transition-colors duration-500",
                    downloadMode === "mobile"
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600"
                        : "bg-white"
                )}>
                    {downloadMode === "mobile" ? (
                        /* MOBILE PREVIEW */
                        <>
                            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="relative z-10 w-full max-w-sm">
                                <h2 className="text-3xl font-bold text-white mb-2">{programName}</h2>
                                <p className="text-white/80 font-medium mb-8 text-lg">
                                    {programType === "Visits" ? "Tarjeta de Sellos Digital" : "Acumula Puntos"}
                                </p>

                                <div className="bg-white p-6 rounded-3xl shadow-2xl mx-auto w-64 h-64 flex items-center justify-center mb-8">
                                    <QRCodeSVG ref={qrRef} value={programUrl} size={200} level="H" includeMargin={false} />
                                </div>

                                <div className="text-white/90 font-bold tracking-widest text-sm bg-black/20 py-3 px-6 rounded-full inline-block backdrop-blur-sm">
                                    ESCANEA PARA UNIRTE
                                </div>
                            </div>
                        </>
                    ) : (
                        /* PRINT PREVIEW */
                        <div className="relative z-10 w-full max-w-sm text-black">
                            <div className="bg-transparent mx-auto w-64 h-64 flex items-center justify-center mb-8">
                                <QRCodeSVG value={programUrl} size={250} level="H" includeMargin={false} />
                            </div>
                            <h2 className="text-2xl font-bold mb-1">{programName}</h2>
                            <p className="text-gray-500 text-sm uppercase tracking-wider font-medium">
                                {programType === "Visits" ? "Programa de Lealtad (Visitas)" : "Programa de Lealtad (Puntos)"}
                            </p>
                        </div>
                    )}
                </div>

                {/* CONTROLS SECTION */}
                <div className="w-full md:w-[400px] bg-[#111] p-8 flex flex-col relative">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold text-white flex gap-2 items-center">
                            <Smartphone className="w-5 h-5 text-violet-500" />
                            Descargar Código QR
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-xl">
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex-1 gap-2 rounded-lg transition-all",
                                downloadMode === "mobile" ? "bg-violet-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                            onClick={() => setDownloadMode("mobile")}
                        >
                            <Smartphone className="w-4 h-4" /> Para Celular
                        </Button>
                        <Button
                            variant="ghost"
                            className={cn(
                                "flex-1 gap-2 rounded-lg transition-all",
                                downloadMode === "print" ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white"
                            )}
                            onClick={() => setDownloadMode("print")}
                        >
                            <Printer className="w-4 h-4" /> Imprimir
                        </Button>
                    </div>

                    <div className={cn(
                        "rounded-xl p-4 mb-auto border transition-colors",
                        downloadMode === "mobile"
                            ? "bg-blue-900/10 border-blue-500/20"
                            : "bg-emerald-900/10 border-emerald-500/20"
                    )}>
                        <div className="flex gap-3 mb-2">
                            {downloadMode === "mobile" ? (
                                <Share2 className="w-5 h-5 text-blue-400 shrink-0" />
                            ) : (
                                <FileDown className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                            <div className="font-bold text-white text-sm">
                                {downloadMode === "mobile" ? "Formato Historia (9:16)" : "Formato Impresión (Alta Res)"}
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            {downloadMode === "mobile"
                                ? "Diseño vertical (1080x1920px) listo para compartir en Instagram Stories, WhatsApp Status o enviar por chat."
                                : "Imagen limpia en alta resolución (2048px) con fondo blanco. Ideal para enviar a diseñadores o imprimir en flyers."
                            }
                        </p>
                    </div>

                    <Button
                        size="lg"
                        className="w-full bg-white text-black hover:bg-gray-200 font-bold mt-8"
                        onClick={handleDownload}
                    >
                        <Download className="w-5 h-5 mr-2" />
                        {downloadMode === "mobile" ? "Descargar para Celular" : "Descargar para Imprimir"}
                    </Button>

                </div>

            </DialogContent>
        </Dialog>
    )
}

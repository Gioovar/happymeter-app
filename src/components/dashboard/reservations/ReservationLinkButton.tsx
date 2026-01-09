"use client"

import { Button } from "@/components/ui/button"
import { Link as LinkIcon, Check, QrCode, Printer, Share2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { QRCodeSVG } from 'qrcode.react'

interface ReservationLinkButtonProps {
    programId: string
    className?: string
}

export function ReservationLinkButton({ programId, className }: ReservationLinkButtonProps) {
    const [copied, setCopied] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    // Ensure we are client-side for window access
    const getLink = () => {
        if (typeof window === 'undefined') return ''
        return `${window.location.origin}/book/${programId}`
    }

    const reservationLink = getLink()

    const handleCopy = () => {
        navigator.clipboard.writeText(reservationLink)
        setCopied(true)
        toast.success("Enlace copiado", {
            description: "Listo para compartir."
        })
        setTimeout(() => setCopied(false), 2000)
    }

    const handlePrint = () => {
        const printContent = document.getElementById("qr-print-area")
        if (!printContent) return

        const windowUrl = 'about:blank'
        const uniqueName = new Date();
        const windowName = 'Print' + uniqueName.getTime();
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=400,height=400');

        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Código QR de Reservas</title>
                        <style>
                            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                            h1 { font-size: 24px; margin-bottom: 20px; }
                            p { color: #666; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <h1>Escanéame para Reservar</h1>
                        ${printContent.innerHTML}
                        <p>${reservationLink}</p>
                    </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.focus()
            setTimeout(() => {
                printWindow.print()
                printWindow.close()
            }, 500)
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
            <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle>Compartir Enlace de Reservas</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Comparte este código o enlace con tus clientes.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-6">
                    {/* QR Code Display */}
                    <div id="qr-print-area" className="bg-white p-4 rounded-xl shadow-lg shadow-white/5">
                        <QRCodeSVG
                            value={reservationLink}
                            size={200}
                            level={"H"}
                            includeMargin={true}
                            imageSettings={{
                                src: "/logo-icon.png", // Assuming existence, otherwise generic QR is fine
                                x: undefined,
                                y: undefined,
                                height: 24,
                                width: 24,
                                excavate: true,
                            }}
                        />
                    </div>

                    <div className="flex gap-4 w-full">
                        <Button onClick={handleCopy} className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white gap-2">
                            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4" />}
                            {copied ? "Copiado" : "Copiar Link"}
                        </Button>
                        <Button onClick={handlePrint} variant="outline" className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2">
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </Button>
                    </div>

                    <div className="w-full text-center">
                        <p className="text-xs text-zinc-500 font-mono break-all px-4 py-2 bg-black/20 rounded-lg">
                            {reservationLink}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

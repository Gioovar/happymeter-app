"use client"

import { useState } from "react"
import { Share2, QrCode as QRIcon, Copy, CheckCircle2, Building2, Coins, ArrowRight } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { acceptB2BReferralTerms } from "@/actions/promoters"

export function B2BReferralDialog({ phone, hasAgreed }: { phone: string, hasAgreed: boolean }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isAgreed, setIsAgreed] = useState(hasAgreed)
    const [isLoading, setIsLoading] = useState(false)

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.happymeters.com'}/partners?ref=${phone}`

    const handleAcceptTerms = async () => {
        setIsLoading(true)
        try {
            const res = await acceptB2BReferralTerms()
            if (res.success) {
                setIsAgreed(true)
                toast.success("¡Bienvenido al programa de referidos B2B!")
            } else {
                toast.error(res.error || "Hubo un error al procesar tu solicitud")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink)
        toast.success("Enlace copiado al portapapeles")
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Únete a HappyMeter',
                    text: 'Te recomiendo usar HappyMeter para gestionar y gamificar tus reservas. Usa mi enlace de invitación:',
                    url: referralLink,
                })
            } catch (err) {
                console.log('Error sharing:', err)
            }
        } else {
            copyToClipboard()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div 
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={(e) => {
                        e.preventDefault()
                        setIsOpen(true)
                    }}
                >
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/30 transition-colors">
                        <Share2 className="w-3 h-3 text-indigo-400" />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">Compartir HappyMeter</span>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md bg-zinc-900 border-white/10 text-white rounded-2xl shadow-2xl p-0 overflow-hidden z-[200]">
                {/* Visual Header */}
                <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <div className="relative z-10 flex flex-col items-center">
                        <Coins className="w-10 h-10 text-white shadow-lg rounded-full mb-2" />
                        <h2 className="text-xl font-black text-white px-6 text-center drop-shadow-md">
                            Programa de Referidos B2B
                        </h2>
                    </div>
                </div>

                <div className="p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="hidden">Referidos</DialogTitle>
                        <DialogDescription className="text-zinc-400 text-center text-sm leading-relaxed">
                            {!isAgreed ? (
                                "Invita a otros antros, bares o restaurantes a usar HappyMeter y gana una comisión mensual del 20% sobre cada suscripción que logres registrar usando tu código o enlace único."
                            ) : (
                                "Muestra este QR o comparte el enlace. El sistema detectará automáticamente que tú los invitaste."
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {!isAgreed ? (
                        <div className="space-y-6">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-zinc-300 leading-tight">La comisión es recurrente por el tiempo que la sucursal referida permanezca activa.</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-zinc-300 leading-tight">Recibirás los depósitos en la cuenta bancaria / CLABE que diste de alta en tu perfil.</p>
                                </div>
                            </div>
                            <Button 
                                onClick={handleAcceptTerms} 
                                disabled={isLoading}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold h-12 shadow-[0_0_20px_rgba(99,102,241,0.2)] rounded-xl group/btn"
                            >
                                {isLoading ? "Activando..." : "Sí, quiero participar"}
                                {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="bg-white p-4 rounded-2xl shadow-xl flex items-center justify-center">
                                <QRCodeSVG 
                                    value={referralLink} 
                                    size={180} 
                                    bgColor={"#ffffff"} 
                                    fgColor={"#000000"} 
                                    level={"M"}
                                />
                            </div>
                            
                            <div className="w-full space-y-3">
                                <div className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between">
                                    <span className="text-xs font-mono text-zinc-400 truncate mr-2">{referralLink}</span>
                                    <Button size="icon" variant="ghost" onClick={copyToClipboard} className="h-8 w-8 text-zinc-400 hover:text-white shrink-0">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <Button 
                                    onClick={handleShare}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-12 shadow-[0_0_20px_rgba(147,51,234,0.3)] rounded-xl"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Compartir mi Link
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

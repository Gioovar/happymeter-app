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
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 group-hover:bg-violet-500/30 transition-colors">
                        <Share2 className="w-3 h-3 text-violet-400" />
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">Compartir HappyMeter</span>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-white/10 text-white rounded-3xl shadow-[0_0_80px_rgba(139,92,246,0.15)] p-0 overflow-hidden z-[200]">
                {/* Visual Header */}
                <div className="h-40 bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
                    <div className="absolute top-[-50%] left-[-10%] w-[120%] h-[200%] bg-[radial-gradient(ellipse_at_top_center,rgba(139,92,246,0.25)_0%,rgba(0,0,0,0)_60%)] pointer-events-none" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-screen pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center mt-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-[1px] mb-3 shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                            <div className="w-full h-full bg-[#0a0a0a] rounded-2xl flex items-center justify-center">
                                <Coins className="w-6 h-6 text-fuchsia-400" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-white px-6 text-center tracking-tight">
                            Referidos B2B
                        </h2>
                    </div>
                </div>

                <div className="px-6 pb-6 relative z-20">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="hidden">Referidos</DialogTitle>
                        <DialogDescription className="text-zinc-400 text-center text-sm leading-relaxed">
                            {!isAgreed ? (
                                "Invita a otros antros, bares o restaurantes a usar HappyMeter y gana una comisión mensual del 20% sobre cada suscripción activa."
                            ) : (
                                "Muestra este QR o comparte el enlace. El sistema detectará automáticamente que tú los invitaste."
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {!isAgreed ? (
                        <div className="space-y-6">
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4 shadow-inner backdrop-blur-xl">
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <p className="text-sm text-zinc-300 leading-snug">La comisión es recurrente por el tiempo que la sucursal permanezca suscrita.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <p className="text-sm text-zinc-300 leading-snug">Recibirás depósitos automáticos en tu cuenta bancaria registrada.</p>
                                </div>
                            </div>
                            <Button 
                                onClick={handleAcceptTerms} 
                                disabled={isLoading}
                                className="w-full bg-white text-black hover:bg-zinc-200 font-bold h-12 rounded-xl group/btn transition-all duration-300"
                            >
                                {isLoading ? "Activando..." : "Sí, quiero participar"}
                                {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                                <div className="relative bg-white p-5 rounded-3xl flex items-center justify-center border-4 border-white/10 shadow-2xl">
                                    <QRCodeSVG 
                                        value={referralLink} 
                                        size={200} 
                                        bgColor={"#ffffff"} 
                                        fgColor={"#0a0a0a"} 
                                        level={"Q"}
                                    />
                                </div>
                            </div>
                            
                            <div className="w-full space-y-3">
                                <div className="w-full pl-4 pr-1 py-1.5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between backdrop-blur-md">
                                    <span className="text-xs font-mono text-zinc-400 truncate mr-2">{referralLink}</span>
                                    <Button size="icon" variant="ghost" onClick={copyToClipboard} className="h-9 w-9 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white shrink-0 rounded-xl transition-colors">
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                
                                <Button 
                                    onClick={handleShare}
                                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold h-12 shadow-[0_0_30px_rgba(139,92,246,0.3)] rounded-xl border border-white/10 transition-all duration-300"
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

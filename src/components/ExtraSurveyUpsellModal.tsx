'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Ban, Loader2, Zap } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ExtraSurveyUpsellModalProps {
    isOpen: boolean
    onClose: () => void
    currentPlanName: string
}

export default function ExtraSurveyUpsellModal({ isOpen, onClose, currentPlanName }: ExtraSurveyUpsellModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handlePurchase = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/stripe/add-extra-survey', {
                method: 'POST',
            })

            const data = await res.json()

            if (!res.ok) {
                // If user has no subscription or other error
                if (res.status === 402 || data.error?.includes('No active subscription')) {
                    toast.error("Necesitas un plan activo para comprar extras. Redirigiendo...")
                    setTimeout(() => {
                        router.push('/pricing')
                    }, 1500)
                    return
                }
                throw new Error(data.error || "Error al procesar la compra")
            }

            toast.success("¡Encuesta adicional activada!", {
                icon: <Zap className="w-5 h-5 text-green-500" />,
                description: "Ya puedes crear tu nueva encuesta.",
                duration: 5000
            })

            // Force refresh of the page/context to update limits
            window.location.reload()
            onClose()

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Ocurrió un error inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-[#0a0a0a] text-white border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.1)] p-0 overflow-hidden hide-close-button ring-1 ring-white/5">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500"></div>
                <div className="p-6">
                    <DialogHeader className="mb-6">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full shrink-0 relative">
                                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full"></div>
                                <Ban className="w-8 h-8 text-red-500 relative z-10" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight text-white mb-2">
                                    Límite de Encuestas Alcanzado
                                </DialogTitle>
                                <DialogDescription className="text-gray-400 text-sm leading-relaxed max-w-[90%] mx-auto">
                                    Has consumido todas las encuestas incluidas en tu plan. ¿Deseas agregar una encuesta extra por <span className="font-bold text-white bg-white/10 px-1.5 py-0.5 rounded text-xs">$200 MXN</span> al mes?
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 bg-gradient-to-br from-violet-500/10 to-transparent rounded-xl border border-violet-500/20 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
                                <Zap className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-white">Activación Inmediata</p>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Se agregará a tu suscripción actual automáticamente. Podrás crear tu nueva encuesta de inmediato y cancelarla cuando desees en ajustes.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-white hover:bg-white/5 px-6"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handlePurchase}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-600/25 border-0 px-6"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                            ) : (
                                "Agregar Encuesta"
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

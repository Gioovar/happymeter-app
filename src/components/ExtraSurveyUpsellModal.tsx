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
            <DialogContent className="sm:max-w-[500px] bg-white text-gray-900 border-gray-200">
                <DialogHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-full shrink-0">
                            <Ban className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                Alcanzaste el límite de encuestas de tu plan
                            </DialogTitle>
                            <DialogDescription className="text-gray-600 mt-2 text-base">
                                ¿Deseas agregar una encuesta extra por <span className="font-bold text-gray-900">$200 MXN</span> al mes?
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900">Activación Inmediata</p>
                            <p className="text-sm text-gray-500">
                                Se agregará a tu suscripción actual automáticamente. Puedes cancelarla cuando quieras.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-3 sm:justify-end mt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-500 hover:text-gray-900"
                    >
                        ❌ Cancelar
                    </Button>
                    <Button
                        onClick={handlePurchase}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white font-medium"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "✅ Agregar encuesta (+$200/mes)"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

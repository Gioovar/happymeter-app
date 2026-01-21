'use client'

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Plus, Check, Loader2, PartyPopper } from "lucide-react"
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
                icon: <PartyPopper className="w-5 h-5 text-green-500" />,
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
            <DialogContent className="sm:max-w-[450px] bg-[#0F0F0F] border border-white/10 text-white p-0 overflow-hidden gap-0 rounded-3xl">
                <div className="relative h-32 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
                    <div className="relative z-10 p-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-xl">
                        <AlertCircle className="w-10 h-10 text-violet-400" />
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Límite Alcanzado</h2>
                        <p className="text-gray-400">
                            Tu plan <span className="text-white font-bold">{currentPlanName}</span> ha alcanzado su máximo de encuestas activas.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 relative group overflow-hidden cursor-pointer hover:bg-violet-500/15 transition-all" onClick={handlePurchase}>
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center shrink-0">
                                        <Plus className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-white">Agregar 1 Encuesta</h3>
                                        <p className="text-xs text-violet-300">+$200 MXN / mes</p>
                                    </div>
                                </div>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                                ) : (
                                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center group-hover:border-violet-400 group-hover:bg-violet-500 text-transparent group-hover:text-white transition-all">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="relative flex items-center py-2">
                            <div className="grow h-px bg-white/10"></div>
                            <span className="shrink-0 px-3 text-xs text-gray-500 uppercase font-medium">O mejora tu plan</span>
                            <div className="grow h-px bg-white/10"></div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-white justify-between px-4 group"
                            onClick={() => {
                                onClose()
                                router.push('/pricing')
                            }}
                        >
                            <span className="font-medium text-gray-300 group-hover:text-white">Ver Planes Superiores</span>
                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-gray-400 group-hover:text-white transition">Más funciones</span>
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full text-gray-500 hover:text-gray-300 hover:bg-transparent"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                    </div>

                    <p className="text-[10px] text-center text-gray-600 px-4">
                        Al agregar una encuesta extra, se sumará un cargo recurrente de $200 MXN a tu suscripción actual. Puedes cancelarla cuando quieras.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}

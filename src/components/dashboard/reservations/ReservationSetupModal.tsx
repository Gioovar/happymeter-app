'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings, PlayCircle, Store, LayoutGrid, CalendarRange, Loader2, Info } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ReservationSetupModalProps {
    isOpen: boolean
    setupLink: string
}

export default function ReservationSetupModal({ isOpen, setupLink }: ReservationSetupModalProps) {
    // We keep it open unless they configure. 
    // Maybe allow closing? User request implies "pop up que le pida configurar". 
    // Usually forced setup modals block interaction or are persistent.
    // Let's make it persistent (cannot close easily) or re-opens? 
    // For good UX, we allow closing but it shows every time the page loads if empty.
    const [open, setOpen] = useState(isOpen)
    const [step, setStep] = useState<'intro' | 'select-mode'>('intro')
    const [isUpdating, setIsUpdating] = useState(false)

    const handleVideoClick = () => {
        toast.info('Tutorial próximamente disponible')
    }

    const setSimpleMode = async () => {
        setIsUpdating(true)
        try {
            const res = await fetch('/api/reservations/toggle-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ simpleMode: true })
            })

            if (res.ok) {
                toast.success('Modo Sencillo activado')
                window.location.reload()
            } else {
                toast.error("Error al configurar el modo")
                setIsUpdating(false)
            }
        } catch (e) {
            toast.error("Error inesperado")
            setIsUpdating(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                {step === 'intro' ? (
                    <>
                        <DialogHeader>
                            <div className="mx-auto bg-amber-500/10 p-4 rounded-full mb-4">
                                <Store className="w-8 h-8 text-amber-500" />
                            </div>
                            <DialogTitle className="text-center text-2xl font-bold">Configura tus Reservas</DialogTitle>
                            <DialogDescription className="text-center text-gray-400">
                                Para comenzar a recibir reservas, necesitas configurar cómo quieres gestionar tus mesas y espacios.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-3 py-4">
                            <Button
                                onClick={() => setStep('select-mode')}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 text-base"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Configurar Ahora
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full border-white/10 hover:bg-white/5 text-gray-300"
                                onClick={handleVideoClick}
                            >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Ver Tutorial (Próximamente)
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <div className="mx-auto bg-violet-500/10 p-4 rounded-full mb-4">
                                <Settings className="w-8 h-8 text-violet-500" />
                            </div>
                            <DialogTitle className="text-center text-2xl font-bold">Selecciona una Modalidad</DialogTitle>
                            <DialogDescription className="text-center text-gray-400">
                                Escoge la forma en que deseas que tus clientes reserven en tu negocio. Puedes cambiar esto más tarde.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 py-4">
                            <Button
                                onClick={setSimpleMode}
                                disabled={isUpdating}
                                className="w-full h-auto py-4 bg-[#1A1A1A] hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center text-white text-left gap-2 relative group"
                            >
                                <div className="flex items-center gap-3 w-full justify-center mb-1">
                                    <CalendarRange className="w-6 h-6 text-violet-400" />
                                    <span className="font-bold text-lg">Reserva Sencilla</span>
                                </div>
                                <span className="text-xs text-gray-400 font-normal text-center max-w-[280px]">
                                    Los clientes solo necesitan elegir fecha, hora y número de personas. Ideal si no quieres asignar mesas específicas desde el inicio.
                                </span>
                            </Button>

                            <Link href={setupLink} className="w-full">
                                <Button
                                    disabled={isUpdating}
                                    className="w-full h-auto py-4 bg-[#1A1A1A] hover:bg-white/10 border border-white/10 flex flex-col items-center justify-center text-white text-left gap-2 relative group"
                                >
                                    <div className="flex items-center gap-3 w-full justify-center mb-1">
                                        <LayoutGrid className="w-6 h-6 text-amber-500" />
                                        <span className="font-bold text-lg">Reserva Avanzada</span>
                                    </div>
                                    <span className="text-xs text-gray-400 font-normal text-center max-w-[280px]">
                                        Dibuja tu plano interactivo. Los clientes podrán visualizar tu salón y elegir una mesa en específico con antelación.
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

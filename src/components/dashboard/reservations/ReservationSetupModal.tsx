'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings, PlayCircle, Store } from 'lucide-react'
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

    const handleVideoClick = () => {
        toast.info('Tutorial próximamente disponible')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-amber-500/10 p-4 rounded-full mb-4">
                        <Store className="w-8 h-8 text-amber-500" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold">Configura tus Reservas</DialogTitle>
                    <DialogDescription className="text-center text-gray-400">
                        Para comenzar a recibir reservas, necesitas definir el plano de tu sucursal y la capacidad de las mesas.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 py-4">
                    <Link href={setupLink} className="w-full">
                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 text-base">
                            <Settings className="w-4 h-4 mr-2" />
                            Configurar Ahora
                        </Button>
                    </Link>

                    <Button
                        variant="outline"
                        className="w-full border-white/10 hover:bg-white/5 text-gray-300"
                        onClick={handleVideoClick}
                    >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Ver Tutorial (Próximamente)
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

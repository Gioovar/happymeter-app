'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings, PlayCircle, Store, LayoutGrid, CalendarRange, Loader2, Info, Clock, Check } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { toast } from 'sonner'
import { setReservationMode } from '@/actions/reservations'

interface ReservationSetupModalProps {
    isOpen: boolean
    setupLink: string
    branchId?: string
}

export default function ReservationSetupModal({ isOpen, setupLink, branchId }: ReservationSetupModalProps) {
    // We keep it open unless they configure. 
    // Maybe allow closing? User request implies "pop up que le pida configurar". 
    // Usually forced setup modals block interaction or are persistent.
    // Let's make it persistent (cannot close easily) or re-opens? 
    // For good UX, we allow closing but it shows every time the page loads if empty.
    const [open, setOpen] = useState(isOpen)
    const [step, setStep] = useState<'intro' | 'select-mode' | 'hours'>('intro')
    const [isUpdating, setIsUpdating] = useState(false)

    // Schedule state
    const [schedule, setSchedule] = useState([
        { id: 'mon', label: 'Lunes', isOpen: true, openTime: "09:00", closeTime: "22:00" },
        { id: 'tue', label: 'Martes', isOpen: true, openTime: "09:00", closeTime: "22:00" },
        { id: 'wed', label: 'Miércoles', isOpen: true, openTime: "09:00", closeTime: "22:00" },
        { id: 'thu', label: 'Jueves', isOpen: true, openTime: "09:00", closeTime: "22:00" },
        { id: 'fri', label: 'Viernes', isOpen: true, openTime: "09:00", closeTime: "22:00" },
        { id: 'sat', label: 'Sábado', isOpen: true, openTime: "09:00", closeTime: "22:00" },
        { id: 'sun', label: 'Domingo', isOpen: true, openTime: "09:00", closeTime: "22:00" },
    ])

    const toggleDay = (index: number) => {
        const newSched = [...schedule]
        newSched[index].isOpen = !newSched[index].isOpen
        setSchedule(newSched)
    }

    const updateTime = (index: number, field: 'openTime' | 'closeTime', val: string) => {
        const newSched = [...schedule]
        newSched[index][field] = val
        setSchedule(newSched)
    }

    const handleVideoClick = () => {
        toast.info('Tutorial próximamente disponible')
    }

    const handleSimpleModeSelect = () => {
        setStep('hours')
    }

    const handleSaveSimpleMode = async () => {
        setIsUpdating(true)
        try {
            const res = await setReservationMode(true, branchId, schedule)

            if (res.success) {
                toast.success('Modo Sencillo activado')
                window.location.reload()
            } else {
                toast.error(res.error || "Error al configurar el modo")
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
                ) : step === 'select-mode' ? (
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
                                onClick={handleSimpleModeSelect}
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
                ) : (
                    <>
                        <DialogHeader>
                            <div className="mx-auto bg-amber-500/10 p-4 rounded-full mb-4">
                                <Clock className="w-8 h-8 text-amber-500" />
                            </div>
                            <DialogTitle className="text-center text-2xl font-bold">Horarios de Reserva</DialogTitle>
                            <DialogDescription className="text-center text-gray-400">
                                Define tus días y horas de atención para comenzar a recibir reservaciones.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-3 py-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 -mr-2">
                            {schedule.map((day, idx) => (
                                <div key={day.id} className="p-3 bg-[#1A1A1A] border border-white/10 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3 w-1/3">
                                        <Switch
                                            checked={day.isOpen}
                                            onCheckedChange={() => toggleDay(idx)}
                                            className="data-[state=checked]:bg-amber-500"
                                        />
                                        <Label className={`font-bold ${day.isOpen ? 'text-white' : 'text-gray-500'}`}>
                                            {day.label}
                                        </Label>
                                    </div>

                                    {day.isOpen ? (
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="time"
                                                value={day.openTime}
                                                onChange={(e) => updateTime(idx, 'openTime', e.target.value)}
                                                className="w-24 bg-black/50 border-white/10 text-white focus-visible:ring-amber-500"
                                            />
                                            <span className="text-gray-500 text-sm">a</span>
                                            <Input
                                                type="time"
                                                value={day.closeTime}
                                                onChange={(e) => updateTime(idx, 'closeTime', e.target.value)}
                                                className="w-24 bg-black/50 border-white/10 text-white focus-visible:ring-amber-500"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-sm font-medium mr-8">Cerrado</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-white/5">
                            <Button
                                variant="outline"
                                onClick={() => setStep('select-mode')}
                                className="border-white/10 hover:bg-white/5 text-gray-400"
                                disabled={isUpdating}
                            >
                                Atrás
                            </Button>
                            <Button
                                onClick={handleSaveSimpleMode}
                                disabled={isUpdating}
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold h-10"
                            >
                                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                                Finalizar y Guardar
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

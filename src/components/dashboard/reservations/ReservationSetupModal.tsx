'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings, PlayCircle, Store, CalendarRange, Loader2, Info, Clock, Check } from 'lucide-react'
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
    const router = useRouter()
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
                router.refresh()
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
                    <div className="flex flex-col items-center justify-center py-6 px-2">
                        <div className="relative mb-8 mt-4">
                            <div className="absolute inset-0 bg-amber-500/30 blur-2xl rounded-full scale-150"></div>
                            <div className="relative bg-gradient-to-tr from-amber-600 to-amber-400 p-5 rounded-3xl shadow-2xl border border-white/20 transform hover:scale-105 transition-transform duration-500">
                                <Store className="w-12 h-12 text-white" strokeWidth={1.5} />
                            </div>
                        </div>

                        <DialogTitle className="text-center text-3xl font-extrabold tracking-tight mb-3">Configura tus Reservas</DialogTitle>
                        <DialogDescription className="text-center text-gray-400 text-base max-w-[90%] mx-auto leading-relaxed mb-8">
                            Activa el motor de reservaciones en tu negocio. Define capacidades, horarios o crea tu plano de mesas interactivo.
                        </DialogDescription>

                        <div className="flex flex-col gap-4 w-full px-4">
                            <Button
                                onClick={() => setStep('select-mode')}
                                className="w-full bg-white hover:bg-gray-100 text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] font-bold h-14 text-lg rounded-2xl group transition-all"
                            >
                                <Settings className="w-5 h-5 mr-2 group-hover:animate-spin-slow" />
                                Comenzar Configuración
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full border-white/10 hover:bg-white/10 text-gray-400 hover:text-white h-12 rounded-xl transition-all"
                                onClick={handleVideoClick}
                            >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Ver Tutorial Rápido
                            </Button>
                        </div>
                    </div>
                ) : step === 'select-mode' ? (
                    <div className="py-2">
                        <DialogHeader className="mb-6">
                            <div className="mx-auto bg-violet-500/10 p-3 rounded-2xl border border-violet-500/20 mb-4 inline-flex items-center justify-center">
                                <Settings className="w-6 h-6 text-violet-400" />
                            </div>
                            <DialogTitle className="text-center text-2xl font-bold">Modo de Reservación</DialogTitle>
                            <DialogDescription className="text-center text-gray-400 text-sm mt-2">
                                ¿Cómo prefieres que tus clientes reserven una mesa?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-5 px-2">
                            <button
                                onClick={handleSimpleModeSelect}
                                disabled={isUpdating}
                                className="w-full group bg-black hover:bg-[#111] border border-white/10 hover:border-violet-500/50 rounded-2xl p-5 text-left transition-all duration-300 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-violet-600/5 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="p-3 bg-violet-500/10 rounded-xl shrink-0">
                                        <CalendarRange className="w-6 h-6 text-violet-400 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white mb-1 group-hover:text-violet-200 transition-colors">Reserva Sencilla</h3>
                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            Clientes eligen fecha, hora y número de personas. Administra tu flujo mediante una lista de espera.
                                        </p>
                                    </div>
                                </div>
                            </button>

                        </div>

                        <div className="mt-6 flex justify-center">
                            <Button variant="ghost" className="text-gray-500 hover:text-white" onClick={() => setStep('intro')}>
                                Volver atrás
                            </Button>
                        </div>
                    </div>
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

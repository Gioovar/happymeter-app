'use client'

import { useState, useTransition } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createReservation } from '@/actions/reservations'
import { Loader2, Calendar as CalendarIcon, Users, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'

interface SimpleReservationFormProps {
    programId: string
    userId: string // Owner ID
    settings: {
        standardTimeEnabled: boolean
        standardDurationMinutes: number
        dailyPaxLimit: number
    }
}

export default function SimpleReservationForm({ programId, userId, settings }: SimpleReservationFormProps) {
    const searchParams = useSearchParams()
    const rpSlug = searchParams.get('rp') || undefined
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [time, setTime] = useState("14:00")
    const [pax, setPax] = useState(2)
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")

    const [isPending, startTransition] = useTransition()

    const handleSubmit = () => {
        if (!date) return toast.error("Selecciona una fecha")
        if (!customerName) return toast.error("Ingresa tu nombre")
        if (!customerPhone) return toast.error("Ingresa tu teléfono")
        if (pax < 1) return toast.error("Mínimo 1 persona")

        startTransition(async () => {
            // Construct Date with Time
            const finalDate = new Date(date)
            if (settings.standardTimeEnabled) {
                const [hours, minutes] = time.split(':').map(Number)
                finalDate.setHours(hours, minutes, 0, 0)
            } else {
                // If not time enabled, usually "All day", but we still nee a time for the record.
                // Let's us e 12:00 or current time if today?
                // Default to 13:00 for now.
                finalDate.setHours(13, 0, 0, 0)
            }

            const res = await createReservation({
                reservations: [{
                    date: finalDate.toISOString(),
                    partySize: pax,
                    tableId: null // Simple Mode = No Table
                }],
                customer: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail
                },
                programId,
                userId,
                promoterSlug: rpSlug
            })

            if (res.success) {
                toast.success("¡Reservación confirmada!")
                // Redirect or show success
                // If redirect logic is in action, it might return action type
                if ((res as any).action === 'REDIRECT_LOYALTY') {
                    window.location.href = `/loyalty/${(res as any).programId}?new=true`
                } else {
                    // Reset form or show success message
                    setCustomerName("")
                    setCustomerPhone("")
                    setCustomerEmail("")
                    toast.message("Te hemos enviado los detalles.")
                }
            } else {
                toast.error(res.error || "Error al reservar")
            }
        })
    }

    return (
        <div className="w-full max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-white">Reservar Mesa</h2>
                <p className="text-zinc-400 text-sm">Completa tus datos para confirmar</p>
            </div>

            <div className="space-y-4">
                {/* Date Picker */}
                <div className="space-y-2 flex flex-col">
                    <Label className="text-zinc-300">Fecha</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal bg-black border-zinc-800 text-white hover:bg-zinc-800 hover:text-white",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800 text-white">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                className="bg-zinc-900 text-white"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Time Picker (Only if Standard Time Enabled) */}
                {settings.standardTimeEnabled && (
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Hora</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="pl-9 bg-black border-zinc-800 text-white"
                            />
                        </div>
                    </div>
                )}

                {/* Pax */}
                <div className="space-y-2">
                    <Label className="text-zinc-300">Personas</Label>
                    <div className="relative">
                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            type="number"
                            min={1}
                            max={20}
                            value={pax}
                            onChange={(e) => setPax(parseInt(e.target.value) || 1)}
                            className="pl-9 bg-black border-zinc-800 text-white"
                        />
                    </div>
                </div>

                <div className="h-px bg-zinc-800 my-4" />

                {/* Customer Details */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Nombre</Label>
                        <Input
                            placeholder="Tu nombre completo"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="bg-black border-zinc-800 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Teléfono</Label>
                        <Input
                            placeholder="Para confirmar tu reserva"
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="bg-black border-zinc-800 text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Email (Opcional)</Label>
                        <Input
                            placeholder="teenvio@correo.com"
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="bg-black border-zinc-800 text-white"
                        />
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl mt-4"
                >
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirmar Reserva
                </Button>
            </div>
        </div>
    )
}

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { requestVisit } from '@/actions/creator-places'
import { Loader2, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ScheduleVisitModalProps {
    isOpen: boolean
    onClose: () => void
    place: any
}

export default function ScheduleVisitModal({ isOpen, onClose, place }: ScheduleVisitModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [time, setTime] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Helper to check valid day for Calendar disabling
    const isDateDisabled = (date: Date) => {
        // Disable past dates
        if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true

        // Disable days not in allowedDays
        if (!place?.scheduleConfig || !place.scheduleConfig.allowedDays?.length) return false
        return !place.scheduleConfig.allowedDays.includes(date.getDay())
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDate || !time) {
            toast.error('Selecciona fecha y hora')
            return
        }

        // Validate Time
        if (place?.scheduleConfig?.timeRange) {
            const { start, end } = place.scheduleConfig.timeRange
            if (start && end) {
                const isOvernight = end < start
                const isValid = isOvernight
                    ? (time >= start || time <= end)
                    : (time >= start && time <= end)

                if (!isValid) {
                    toast.error(`La hora debe estar entre ${start} y ${end}`)
                    return
                }
            }
        }

        setLoading(true)
        try {
            // Combine selected date and time
            const visitDateTime = new Date(selectedDate)
            const [hours, minutes] = time.split(':')
            visitDateTime.setHours(parseInt(hours), parseInt(minutes))

            await requestVisit(place.id, visitDateTime)
            setSuccess(true)
        } catch (error) {
            toast.error('Error al agendar visita')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setSuccess(false)
        setSelectedDate(undefined)
        setTime('')
        onClose()
    }

    const DAYS_MAP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#111] border-white/10 text-white max-w-3xl p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-violet-500" />
                        Agendar visita a {place?.name}
                    </DialogTitle>
                </DialogHeader>

                {success ? (
                    <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in zoom-in-50">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-2">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white">¡Listo!</h3>
                        <p className="text-gray-400 text-sm max-w-xs">
                            Tu solicitud ha sido enviada a revisión. Te notificaremos cuando el staff la apruebe.
                        </p>
                        <button
                            onClick={handleClose}
                            className="mt-4 px-8 py-2 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition"
                        >
                            Entendido
                        </button>
                    </div>
                ) : (
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Calendar Section */}
                        <div className="space-y-4">
                            <div className="bg-white/5 rounded-xl border border-white/10 p-2 flex justify-center">
                                <Calendar
                                    mode="single"
                                    locale={es} // Set Spanish locale
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={isDateDisabled}
                                    // Highlight available days (not disabled)
                                    modifiers={{
                                        available: (date) => !isDateDisabled(date)
                                    }}
                                    modifiersClassNames={{
                                        available: "bg-violet-500/20 text-white font-bold border border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.15)]"
                                    }}
                                    initialFocus
                                    className="rounded-md border-none"
                                />
                            </div>
                            <p className="text-xs text-center text-gray-500">
                                Los días no disponibles están deshabilitados.
                            </p>
                        </div>

                        {/* Form Section */}
                        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col justify-center">
                            <div className="bg-violet-900/10 p-4 rounded-xl border border-violet-500/20 space-y-2">
                                <p className="text-xs text-violet-300 font-bold uppercase tracking-wider">Horario Permitido</p>
                                {place?.scheduleConfig?.timeRange?.start ? (
                                    <div className="flex flex-col gap-1 z-10 relative">
                                        <span className="text-2xl font-bold text-white tracking-tight">
                                            {place.scheduleConfig.timeRange.start} - {place.scheduleConfig.timeRange.end}
                                        </span>
                                        {place.scheduleConfig.allowedDays && place.scheduleConfig.allowedDays.length > 0 && (
                                            <p className="text-xs text-violet-200/50 mt-1 uppercase tracking-wider font-semibold">
                                                {place.scheduleConfig.allowedDays
                                                    .map((d: number) => DAYS_MAP[d])
                                                    .join(', ')
                                                }
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Sin restricciones de horario</span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Hora de Visita
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-violet-500 transition text-center text-lg"
                                />
                            </div>

                            {selectedDate && (
                                <p className="text-sm text-center text-violet-300">
                                    Fecha: {format(selectedDate, "PPP", { locale: es })}
                                </p>
                            )}

                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !selectedDate || !time}
                                    className="flex-1 px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition shadow-lg shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

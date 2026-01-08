"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Wand2, Settings, Clock, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ReservationCalendarProps {
    reservations?: any[]
    onDateSelect?: (date: Date) => void
}

const DAYS = [
    { id: 'mon', label: 'Lunes' },
    { id: 'tue', label: 'Martes' },
    { id: 'wed', label: 'Miércoles' },
    { id: 'thu', label: 'Jueves' },
    { id: 'fri', label: 'Viernes' },
    { id: 'sat', label: 'Sábado' },
    { id: 'sun', label: 'Domingo' },
]

export function ReservationCalendar({ reservations = [], onDateSelect }: ReservationCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 0)) // Start Jan 2026 as per screenshot
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Availability State (Mock for now)
    const [availability, setAvailability] = useState(
        DAYS.map(d => ({ ...d, isOpen: true, openTime: "09:00", closeTime: "22:00" }))
    )

    const handleAvailabilityChange = (id: string, field: string, value: any) => {
        setAvailability(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
    }

    // Helpers
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year: number, month: number) => {
        // 0 = Sunday, 1 = Monday. We want Monday start? Screenshot shows LU MA MI... (Monday First)
        const day = new Date(year, month, 1).getDay()
        return day === 0 ? 6 : day - 1
    }

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    const dayNames = ["LU", "MA", "MI", "JU", "VI", "SÁ", "DO"]

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    const handleDateClick = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        setSelectedDate(newDate)
        if (onDateSelect) onDateSelect(newDate)
    }

    // Generate Calendar Grid
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())
    const days = []

    for (let i = 0; i < firstDay; i++) {
        days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i)
    }

    const hasReservations = (day: number) => {
        return [1, 2, 3, 4, 5, 6, 7].includes(day)
    }

    return (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    title="Configurar Horarios"
                >
                    <Settings className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white capitalize">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex gap-1 text-zinc-400">
                    <button onClick={handlePrevMonth} className="p-1 hover:text-white transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={handleNextMonth} className="p-1 hover:text-white transition-colors">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-4">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-zinc-500 text-sm font-bold py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-4 gap-x-1">
                {days.map((day, index) => {
                    if (day === null) return <div key={`empty-${index}`} />

                    const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth()
                    const hasRes = hasReservations(day)

                    const isHighlighted = hasRes

                    return (
                        <div key={day} className="flex justify-center">
                            <button
                                onClick={() => handleDateClick(day)}
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all relative
                                    ${isSelected
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-110 z-10'
                                        : isHighlighted
                                            ? 'bg-indigo-600/80 text-white hover:bg-indigo-500' // Matches the purple circles
                                            : 'text-zinc-300 hover:bg-white/10'
                                    }
                                `}
                            >
                                {day}
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Footer Button - Matching Screenshot */}
            <button className="w-full mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                <Wand2 className="w-5 h-5" />
                Generar Estrategias
            </button>

            {/* Availability Settings Modal */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Configuración de Disponibilidad</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Define qué días y en qué horarios aceptas reservaciones.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {availability.map((day) => (
                            <div key={day.id} className="flex flex-col gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor={`switch-${day.id}`} className="font-bold flex items-center gap-2 cursor-pointer">
                                        <div className={`w-2 h-2 rounded-full ${day.isOpen ? 'bg-indigo-500' : 'bg-zinc-700'}`} />
                                        {day.label}
                                    </Label>
                                    <Switch
                                        id={`switch-${day.id}`}
                                        checked={day.isOpen}
                                        onCheckedChange={(c) => handleAvailabilityChange(day.id, 'isOpen', c)}
                                    />
                                </div>

                                {day.isOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-2 pl-4"
                                    >
                                        <div className="relative flex-1">
                                            <Clock className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                                            <Input
                                                type="time"
                                                className="pl-9 bg-zinc-800 border-zinc-700 text-sm"
                                                value={day.openTime}
                                                onChange={(e) => handleAvailabilityChange(day.id, 'openTime', e.target.value)}
                                            />
                                        </div>
                                        <span className="text-zinc-500 text-xs font-medium">A</span>
                                        <div className="relative flex-1">
                                            <Clock className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                                            <Input
                                                type="time"
                                                className="pl-9 bg-zinc-800 border-zinc-700 text-sm"
                                                value={day.closeTime}
                                                onChange={(e) => handleAvailabilityChange(day.id, 'closeTime', e.target.value)}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setIsSettingsOpen(false)} className="w-full bg-white text-black hover:bg-zinc-200">
                            <Check className="w-4 h-4 mr-2" /> Guardar Horarios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

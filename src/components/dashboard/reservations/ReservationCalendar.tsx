"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Wand2 } from "lucide-react"
import { generateReservationListPDF } from "@/lib/pdf-generator"

interface ReservationCalendarProps {
    reservations?: any[]
    onDateSelect?: (date: Date) => void
}

export function ReservationCalendar({ reservations = [], onDateSelect }: ReservationCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date()) // Starts on current real date
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Helpers
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year: number, month: number) => {
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

    const handlePrintReport = () => {
        if (!selectedDate) {
            alert("Por favor selecciona un día en el calendario para imprimir el reporte.")
            return
        }

        // Mock data for PDF demo (if reservations prop is empty)
        const dataToPrint = (reservations && reservations.length > 0) ? reservations : [
            { time: '13:00', customerName: 'Familia González', tableName: 'Mesa 4', pax: 4, status: 'confirmed' },
            { time: '14:30', customerName: 'Juan Pérez', tableName: 'Mesa 2', pax: 2, status: 'confirmed' },
            { time: '19:00', customerName: 'Cena Empresarial', tableName: 'Terraza 1', pax: 12, status: 'pending' },
            { time: '20:00', customerName: 'María Rodríguez', tableName: 'Mesa 5', pax: 2, status: 'confirmed' },
            { time: '21:15', customerName: 'Carlos Ruiz', tableName: 'Barra', pax: 1, status: 'confirmed' },
        ]

        generateReservationListPDF(selectedDate, dataToPrint)
    }

    // Generate Calendar Grid
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth())
    const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth())
    const days = []

    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    const hasReservations = (day: number) => {
        if (!reservations || reservations.length === 0) return false

        // Create date for this specific calendar cell
        const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)

        // Normalize to YYYY-MM-DD to compare securely ignoring time
        const cellDateStr = cellDate.toISOString().split('T')[0]

        // Check availability
        return reservations.some((r: any) => {
            // Assume r.date is string or Date object
            const rDate = new Date(r.date)
            const rDateStr = rDate.toISOString().split('T')[0]
            return rDateStr === cellDateStr
        })
    }

    return (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl relative">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="w-9" /> {/* Spacer */}

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
                                            ? 'bg-indigo-600/80 text-white hover:bg-indigo-500'
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

            {/* Footer Button - Print Report */}
            <button
                onClick={handlePrintReport}
                className="w-full mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
                <Wand2 className="w-5 h-5" />
                Imprimir Lista de Reservas
            </button>


        </div>
    )
}

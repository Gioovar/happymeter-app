"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Wand2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ReservationCalendarProps {
    reservations?: any[]
    onDateSelect?: (date: Date) => void
}

export function ReservationCalendar({ reservations = [], onDateSelect }: ReservationCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 0)) // Start Jan 2026 as per screenshot
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

    // Pad empty start
    for (let i = 0; i < firstDay; i++) {
        days.push(null)
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i)
    }

    // Mock Data for "Highlighted" days (Reservations)
    // In real app, check 'reservations' prop
    const hasReservations = (day: number) => {
        // Just mocking specific days from screenshot for visual check
        return [1, 2, 3, 4, 5, 6, 7].includes(day)
    }

    return (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white capitalize">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex gap-2 text-zinc-400">
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

                    // Style matching screenshot:
                    // Selected/Highlighted: Purple Circle (bg-indigo-600)
                    // Normal text: White

                    // If mock has reservations, show as purple circle? 
                    // Screenshot shows 1,2,3,4,5,6,7 all highlighted.
                    // 5,6,7 are visually distinct?
                    // Let's assume High Intensity = Purple.

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
        </div>
    )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SequentialDatePickerProps {
    value?: Date
    onChange: (date: Date) => void
    onClose?: () => void
    showYear?: boolean
    includeTime?: boolean
}

type Step = 'YEAR' | 'MONTH' | 'DAY' | 'TIME'

export function SequentialDatePicker({ value, onChange, onClose, showYear = true, includeTime = false }: SequentialDatePickerProps) {
    const [step, setStep] = useState<Step>(showYear ? 'YEAR' : 'MONTH')
    const [selectedYear, setSelectedYear] = useState<number>(value ? value.getFullYear() : new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number>(value ? value.getMonth() : new Date().getMonth())
    const [selectedDay, setSelectedDay] = useState<number | null>(value ? value.getDate() : null)
    const [selectedTime, setSelectedTime] = useState<string | null>(value ? format(value, 'HH:mm') : null)

    // Force step adjustment if showYear changes (fixes HMR/State persistence issues)
    useEffect(() => {
        if (!showYear && step === 'YEAR') {
            setStep('MONTH')
        }
    }, [showYear, step])

    // Years to show (1920 - Current Year)
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

    // Months
    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ]

    // Days in selected month
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate()
    }
    const days = Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1)

    // Time Slots (30 min increments)
    const timeSlots = []
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 30) {
            const hour = i.toString().padStart(2, '0')
            const minute = j.toString().padStart(2, '0')
            timeSlots.push(`${hour}:${minute}`)
        }
    }

    // Handle Selection
    const handleYearSelect = (year: number) => {
        setSelectedYear(year)
        setStep('MONTH')
    }

    const handleMonthSelect = (index: number) => {
        setSelectedMonth(index)
        setStep('DAY')
    }

    const handleDaySelect = (day: number) => {
        setSelectedDay(day)
        if (includeTime) {
            setStep('TIME')
        } else {
            // If time is not included, confirm selection immediately after day
            const newDate = new Date(selectedYear, selectedMonth, day)
            onChange(newDate)
            if (onClose) onClose()
        }
    }

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time)
    }

    const confirmSelection = () => {
        if (selectedDay) {
            const newDate = new Date(selectedYear, selectedMonth, selectedDay)

            if (includeTime && selectedTime) {
                const [hours, minutes] = selectedTime.split(':').map(Number)
                newDate.setHours(hours, minutes)
            }

            onChange(newDate)
            if (onClose) onClose()
        }
    }

    // Header logic
    const handleBack = () => {
        if (step === 'TIME') setStep('DAY')
        else if (step === 'DAY') setStep('MONTH')
        else if (step === 'MONTH' && showYear) setStep('YEAR')
    }

    const getTitle = () => {
        if (step === 'YEAR') return 'Selecciona el Año'
        if (step === 'MONTH') return 'Selecciona el Mes'
        if (step === 'DAY') return 'Selecciona el Día'
        return 'Selecciona la Hora'
    }

    const getSubtitle = () => {
        if (step === 'YEAR') return '¿En qué año naciste?' // Or generalized
        if (step === 'MONTH') return `${selectedYear}`
        if (step === 'DAY') return `${months[selectedMonth]} ${selectedYear}`
        return `${selectedDay} de ${months[selectedMonth]}`
    }

    return (
        <div className="w-full max-w-[320px] md:max-w-[320px] bg-[#1a1a1a] text-white p-4 mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                {(step !== 'YEAR' && !(step === 'MONTH' && !showYear)) ? (
                    <button onClick={handleBack} className="p-1 hover:bg-white/10 rounded-full transition">
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                ) : (
                    <div className="w-7"></div>
                )}
                <div className="text-center">
                    <h3 className="font-bold text-sm">{getTitle()}</h3>
                    <p className="text-xs text-gray-400 font-mono">{getSubtitle()}</p>
                </div>
                <div className="w-7"></div>
            </div>

            {/* Content Swapper */}
            <div className="h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                {/* YEAR VIEW */}
                {step === 'YEAR' && (
                    <div className="grid grid-cols-3 gap-2">
                        {years.map(year => (
                            <button
                                key={year}
                                onClick={() => handleYearSelect(year)}
                                className={cn(
                                    "py-3 rounded-lg text-sm font-medium transition hover:bg-white/10",
                                    selectedYear === year ? "bg-violet-600 text-white hover:bg-violet-500" : "bg-[#252525] text-gray-300"
                                )}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                )}

                {/* MONTH VIEW */}
                {step === 'MONTH' && (
                    <div className="grid grid-cols-2 gap-2">
                        {months.map((month, idx) => (
                            <button
                                key={month}
                                onClick={() => handleMonthSelect(idx)}
                                className={cn(
                                    "py-4 rounded-lg text-sm font-medium transition hover:bg-white/10 flex items-center justify-between px-4",
                                    selectedMonth === idx ? "bg-violet-600 text-white hover:bg-violet-500" : "bg-[#252525] text-gray-300"
                                )}
                            >
                                <span>{month}</span>
                                {selectedMonth === idx && <Check className="w-4 h-4 ml-2" />}
                            </button>
                        ))}
                    </div>
                )}

                {/* DAY VIEW */}
                {step === 'DAY' && (
                    <div className="grid grid-cols-5 gap-2">
                        {days.map(day => (
                            <button
                                key={day}
                                onClick={() => handleDaySelect(day)}
                                className={cn(
                                    "aspect-square rounded-lg text-sm font-medium transition hover:bg-white/10 flex items-center justify-center",
                                    selectedDay === day
                                        ? "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20"
                                        : "bg-[#252525] text-gray-300"
                                )}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                )}

                {/* TIME VIEW */}
                {step === 'TIME' && (
                    <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map(time => (
                            <button
                                key={time}
                                onClick={() => handleTimeSelect(time)}
                                className={cn(
                                    "py-2 rounded-lg text-sm font-medium transition hover:bg-white/10",
                                    selectedTime === time
                                        ? "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/20"
                                        : "bg-[#252525] text-gray-300"
                                )}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirm Button */}
            {((includeTime && step === 'TIME') || (!includeTime && step === 'DAY')) && (
                <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                        onClick={confirmSelection}
                        disabled={!selectedDay || (includeTime && !selectedTime)}
                        className={cn(
                            "w-full py-3 rounded-xl font-bold transition flex items-center justify-center gap-2",
                            "bg-white text-black hover:bg-gray-200",
                            (!selectedDay || (includeTime && !selectedTime)) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Check className="w-4 h-4" />
                        Listo
                    </button>
                </div>
            )}
        </div>
    )
}

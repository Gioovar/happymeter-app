
'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Check, ChevronRight, Sparkles } from 'lucide-react'
import { DateRange, DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import 'react-day-picker/dist/style.css'

interface DateRangePickerProps {
    className?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    onGenerate?: () => void
    inline?: boolean
}

export function DateRangePicker({
    className,
    date,
    setDate,
    onGenerate,
    inline = false
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date)

    // Sync temp date when opening or when date changes externally
    React.useEffect(() => {
        if (isOpen || inline) {
            setTempDate(date)
        }
    }, [isOpen, date, inline])

    const handleGenerate = () => {
        setDate(tempDate)
        setIsOpen(false)
        if (onGenerate) onGenerate()
    }

    // --- INLINE MODE ---
    if (inline) {
        return (
            <div className={cn("w-full bg-[#0f1115] border border-white/10 rounded-[24px] shadow-2xl p-6", className)}>
                {/* Styles for Calendar */}
                <style>{`
                    .rdp { margin: 0; width: 100%; }
                    .rdp-month { width: 100%; }
                    .rdp-table { width: 100%; max-width: none; }
                    .rdp-caption { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .rdp-caption_label { font-size: 0.9rem; font-weight: 700; color: white; text-transform: capitalize; }
                    .rdp-nav { display: flex; gap: 8px; }
                    .rdp-nav_button { color: gray; border-radius: 6px; padding: 4px; transition: all 0.2s; }
                    .rdp-nav_button:hover { background: rgba(255,255,255,0.1); color: white; }
                    .rdp-head_cell { color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; padding-bottom: 12px; }
                    .rdp-day { width: 40px; height: 40px; border-radius: 999px; font-size: 0.875rem; color: #d1d5db; transition: all 0.15s; margin: 0 auto; }
                    .rdp-day:hover:not(.rdp-day_selected) { background: rgba(255,255,255,0.1); }
                    .rdp-day_selected { background: #8b5cf6 !important; color: white !important; font-weight: bold; border-radius: 99px !important; }
                    .rdp-day_today { box-shadow: 0 0 0 1px #8b5cf6; } 
                `}</style>

                <DayPicker
                    mode="range"
                    defaultMonth={new Date()}
                    selected={date} // Directly use parent state in inline mode
                    onSelect={setDate} // Directly update parent state in inline mode
                    numberOfMonths={1}
                    locale={es}
                />
            </div>
        )
    }

    // --- POPOVER MODE (Default) ---
    return (
        <div className={cn("relative", className)}>
            {/* 1. Main Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "group flex items-center justify-between gap-4 w-full md:w-auto min-w-[300px] bg-[#15171e] hover:bg-[#1a1d26] border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-violet-500/30",
                    isOpen && "border-violet-500/50 bg-[#1a1d26] shadow-[0_0_20px_rgba(139,92,246,0.2)]"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        date?.from ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-gray-400 group-hover:bg-white/10"
                    )}>
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Periodo del Reporte</p>
                        <h3 className={cn("text-base font-bold", date?.from ? "text-white" : "text-gray-400")}>
                            {date?.from ? (
                                date.to ? (
                                    `${format(date.from, "d MMM", { locale: es })} - ${format(date.to, "d MMM, y", { locale: es })}`
                                ) : (
                                    format(date.from, "d MMMM, y", { locale: es })
                                )
                            ) : (
                                "Seleccionar Fechas"
                            )}
                        </h3>
                    </div>
                </div>
                <div className={cn(
                    "w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-transform duration-300",
                    isOpen ? "rotate-90 bg-white/10 text-white" : "text-gray-500 group-hover:border-violet-500/30 group-hover:text-violet-400"
                )}>
                    <ChevronRight className="w-4 h-4" />
                </div>
            </button>

            {/* 2. The Popover Content */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-4 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                        <div className="bg-[#0f1115] border border-white/10 rounded-[24px] shadow-2xl p-6 w-auto min-w-[350px] overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-white font-bold text-lg flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-fuchsia-500" />
                                    Configurar Reporte
                                </h4>
                                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/5">
                                    Manual IA
                                </span>
                            </div>

                            {/* Calendar Style Overrides */}
                            <style>{`
                                .rdp { margin: 0; }
                                .rdp-caption { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                                .rdp-caption_label { font-size: 0.9rem; font-weight: 700; color: white; text-transform: capitalize; }
                                .rdp-nav { display: flex; gap: 8px; }
                                .rdp-nav_button { color: gray; border-radius: 6px; padding: 4px; transition: all 0.2s; }
                                .rdp-nav_button:hover { background: rgba(255,255,255,0.1); color: white; }
                                .rdp-head_cell { color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; padding-bottom: 12px; }
                                .rdp-day { width: 40px; height: 40px; border-radius: 999px; font-size: 0.875rem; color: #d1d5db; transition: all 0.15s; }
                                .rdp-day:hover:not(.rdp-day_selected) { background: rgba(255,255,255,0.1); }
                                .rdp-day_selected { background: #8b5cf6 !important; color: white !important; font-weight: bold; border-radius: 99px !important; }
                                .rdp-day_range_middle { background: rgba(139, 92, 246, 0.15) !important; color: #a78bfa !important; border-radius: 0 !important; }
                                .rdp-day_range_start { border-radius: 99px 0 0 99px !important; }
                                .rdp-day_range_end { border-radius: 0 99px 99px 0 !important; }
                                .rdp-day_today { box-shadow: 0 0 0 1px #8b5cf6; } 
                            `}</style>

                            <DayPicker
                                mode="range"
                                defaultMonth={new Date()}
                                selected={tempDate} // Use temp state in popover mode
                                onSelect={setTempDate}
                                numberOfMonths={1}
                                locale={es}
                            />

                            {/* Action Footer */}
                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={!tempDate?.from || !tempDate?.to}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <Check className="w-4 h-4" />
                                    Generar Reporte
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

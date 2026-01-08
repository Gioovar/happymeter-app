// @ts-nocheck
"use client"


import { useState } from "react"
import { CalendarIcon, Clock, User, Phone, Mail, Users } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CreateReservationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userProfile?: {
        name?: string
        email?: string
        phone?: string
    }
}

// Mock Available Tables (In real app, fetch based on Date/Time)
const MOCK_TABLES = [
    { id: 't1', label: 'Mesa 1', capacity: 4 },
    { id: 't2', label: 'Mesa 2', capacity: 4 },
    { id: 't3', label: 'Mesa 3', capacity: 2 },
    { id: 't4', label: 'Barra', capacity: 5 },
    { id: 't5', label: 'Terraza 1', capacity: 6 },
]

export function CreateReservationDialog({ open, onOpenChange, userProfile }: CreateReservationDialogProps) {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [selectedTables, setSelectedTables] = useState<string[]>([])

    // Form State
    const [formData, setFormData] = useState({
        pax: 5,
        time: "20:33", // Mock default matching screenshot
        name: userProfile?.name || "",
        phone: userProfile?.phone || "",
        email: userProfile?.email || ""
    })

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const toggleTable = (tableId: string) => {
        setSelectedTables(prev =>
            prev.includes(tableId)
                ? prev.filter(id => id !== tableId)
                : [...prev, tableId]
        )
    }

    // Capacity Logic
    const pax = parseInt(formData.pax.toString() || '0')
    const selectedCapacity = selectedTables.reduce((sum, tableId) => {
        const table = MOCK_TABLES.find(t => t.id === tableId)
        return sum + (table?.capacity || 0)
    }, 0)

    // Only enforce if pax > 0. If 0, let it pass (or block).
    const isCapacitySufficient = pax > 0 ? selectedCapacity >= pax : false

    const showPhoneInput = !userProfile?.phone
    const showEmailInput = !userProfile?.email

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#1a1a1a] border-zinc-800 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex justify-between items-start">
                        <DialogTitle className="text-xl font-bold text-green-400">Realizar Reservación</DialogTitle>
                    </div>
                    <DialogDescription className="text-zinc-400">
                        Completa tu información para realizar la reservación.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* PAX */}
                    <div className="space-y-2">
                        <Label className="text-green-400 font-bold">Número De Personas</Label>
                        <Input
                            type="number"
                            value={formData.pax}
                            onChange={(e) => handleChange('pax', e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-zinc-300 focus:ring-green-500/50 focus:border-green-500"
                        />
                    </div>

                    {/* DATE */}
                    <div className="space-y-2 flex flex-col">
                        <Label className="text-green-400 font-bold">Selecciona La Fecha De La Reservación</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-between text-left font-bold bg-white text-black hover:bg-zinc-200 border-0",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    {date ? format(date, "dd/MM/yyyy") : <span>DD/MM/YYYY</span>}
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    className="bg-zinc-900 text-white"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* TIME */}
                    <div className="space-y-2">
                        <Label className="text-green-400 font-bold">Hora De La Reservación</Label>
                        <div className="relative">
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={(e) => handleChange('time', e.target.value)}
                                className="bg-white text-black font-bold border-0 pr-10"
                            />
                            <Clock className="absolute right-3 top-2.5 h-5 w-5 text-black" />
                        </div>
                    </div>

                    {/* TABLE SELECTION (MULTI) */}
                    <div className="space-y-2 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <Label className="text-green-400 font-bold">Seleccionar Mesa(s)</Label>
                            <span className={cn(
                                "text-xs font-bold transition-colors",
                                isCapacitySufficient ? "text-green-400" : "text-orange-500"
                            )}>
                                Capacidad: {selectedCapacity} / {pax}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {MOCK_TABLES.map(table => {
                                const isSelected = selectedTables.includes(table.id)
                                return (
                                    <div
                                        key={table.id}
                                        onClick={() => toggleTable(table.id)}
                                        className={cn(
                                            "cursor-pointer p-2 rounded-lg border text-sm flex items-center justify-between transition-all select-none",
                                            isSelected
                                                ? "bg-green-500/20 border-green-500 text-white"
                                                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500"
                                        )}
                                    >
                                        <span className="font-medium">{table.label}</span>
                                        <span className="text-xs bg-black/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Users className="w-3 h-3" /> {table.capacity}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                        {!isCapacitySufficient && pax > 0 && (
                            <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Selecciona más mesas para completar el cupo.
                            </p>
                        )}
                    </div>

                    {/* NAME */}
                    <div className="space-y-2">
                        <Label className="text-green-400 font-bold">Nombre</Label>
                        <Input
                            placeholder="Nombre de la persona"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-600 focus:ring-green-500/50 focus:border-green-500"
                        />
                    </div>

                    {/* PHONE (CONDITIONAL) */}
                    {showPhoneInput && (
                        <div className="space-y-2">
                            <Label className="text-green-400 font-bold">Teléfono</Label>
                            <Input
                                placeholder="55 5555 5555"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-600 focus:ring-green-500/50 focus:border-green-500"
                            />
                        </div>
                    )}

                    {/* EMAIL (CONDITIONAL) */}
                    {showEmailInput && (
                        <div className="space-y-2">
                            <Label className="text-green-400 font-bold">Correo</Label>
                            <Input
                                placeholder="gmail@gmail.com"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-600 focus:ring-green-500/50 focus:border-green-500"
                            />
                        </div>
                    )}
                </div>

                <Button
                    disabled={!isCapacitySufficient}
                    className={cn(
                        "w-auto font-extrabold text-lg mt-4 self-start px-8 rounded-lg transition-all",
                        isCapacitySufficient
                            ? "bg-[#d4ff33] text-black hover:bg-[#b8e600]"
                            : "bg-zinc-700 text-zinc-500 cursor-not-allowed opacity-50"
                    )}
                >
                    Confirmar Reserva
                </Button>
            </DialogContent>
        </Dialog>
    )
}

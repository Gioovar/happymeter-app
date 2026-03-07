"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Loader2, Check, Copy } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { setReservationMode } from "@/actions/reservations" // Will reuse to update mode + schedule
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ReservationScheduleDialogProps {
    currentSchedule: any[]
    branchId?: string
    isSimpleMode: boolean
    otherBranches?: { id: string, name: string, schedule: any[] }[]
}

export function ReservationScheduleDialog({ currentSchedule, branchId, isSimpleMode, otherBranches = [] }: ReservationScheduleDialogProps) {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [schedule, setSchedule] = useState(() => {
        // Ensure there's a valid schedule or fallback
        if (currentSchedule && currentSchedule.length === 7) return currentSchedule;
        return [
            { id: 'mon', label: 'Lunes', isOpen: true, openTime: "09:00", closeTime: "22:00" },
            { id: 'tue', label: 'Martes', isOpen: true, openTime: "09:00", closeTime: "22:00" },
            { id: 'wed', label: 'Miércoles', isOpen: true, openTime: "09:00", closeTime: "22:00" },
            { id: 'thu', label: 'Jueves', isOpen: true, openTime: "09:00", closeTime: "22:00" },
            { id: 'fri', label: 'Viernes', isOpen: true, openTime: "09:00", closeTime: "22:00" },
            { id: 'sat', label: 'Sábado', isOpen: true, openTime: "09:00", closeTime: "22:00" },
            { id: 'sun', label: 'Domingo', isOpen: true, openTime: "09:00", closeTime: "22:00" },
        ]
    })

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

    const handleClone = (branch: any) => {
        if (branch.schedule && branch.schedule.length === 7) {
            setSchedule(branch.schedule)
            toast.success(`Horario copiado de ${branch.name}. No olvides guardar cambios.`)
        } else {
            toast.error("El horario de la sucursal no es válido.")
        }
    }

    const handleSave = () => {
        startTransition(async () => {
            // We reuse setReservationMode because it merges `simpleMode` and `availability`.
            // Alternatively, we could create an `updateAvailability` action, but `setReservationMode` is already doing exactly this.
            const result = await setReservationMode(isSimpleMode, branchId, schedule)

            if (result.success) {
                toast.success("Horarios guardados")
                setOpen(false)
            } else {
                toast.error(result.error || "Error al guardar horarios")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="hidden md:inline">Horarios</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 mb-4 inline-flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <DialogTitle className="text-center text-2xl font-bold">Horarios de Reserva</DialogTitle>
                    <DialogDescription className="text-center text-gray-400 mt-2">
                        Edita tus días y horas de atención para recibir reservaciones.
                    </DialogDescription>
                    {otherBranches.length > 0 && (
                        <div className="flex justify-center mt-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="bg-zinc-800 border-white/10 text-white hover:bg-zinc-700">
                                        <Copy className="w-4 h-4 mr-2" />
                                        Clonar de otra sucursal
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#1A1A1A] border-white/10 text-white">
                                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-400">
                                        Selecciona una sucursal
                                    </div>
                                    {otherBranches.map(b => (
                                        <DropdownMenuItem
                                            key={b.id}
                                            onClick={() => handleClone(b)}
                                            className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                                        >
                                            {b.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </DialogHeader>

                <div className="flex flex-col gap-3 py-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 -mr-2">
                    {schedule.map((day, idx) => (
                        <div key={day.id} className="p-3 bg-[#1A1A1A] border border-white/10 rounded-xl flex items-center justify-between transition-colors hover:bg-white/5">
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
                                        className="w-24 bg-black/50 border-white/10 text-white focus-visible:ring-amber-500 rounded-lg"
                                    />
                                    <span className="text-gray-500 text-sm">a</span>
                                    <Input
                                        type="time"
                                        value={day.closeTime}
                                        onChange={(e) => updateTime(idx, 'closeTime', e.target.value)}
                                        className="w-24 bg-black/50 border-white/10 text-white focus-visible:ring-amber-500 rounded-lg"
                                    />
                                </div>
                            ) : (
                                <span className="text-gray-500 text-sm font-medium mr-8">Cerrado</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-zinc-800 text-gray-400">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isPending} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                        {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        {isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

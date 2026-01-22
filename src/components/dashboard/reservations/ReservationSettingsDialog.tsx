"use client"

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Settings, Clock, AlertTriangle, ShieldCheck } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { updateReservationSettings } from "@/actions/reservations" // We will create this
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ReservationSettingsDialogProps {
    settings: {
        enabled: boolean
        durationMinutes: number
    }
}

export function ReservationSettingsDialog({ settings }: ReservationSettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const [enabled, setEnabled] = useState(settings?.enabled || false)
    const [duration, setDuration] = useState(settings?.durationMinutes || 120) // Default 2 hours
    const [isPending, startTransition] = useTransition()

    const hours = Math.floor(duration / 60)
    const minutes = duration % 60

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateReservationSettings({
                standardTimeEnabled: enabled,
                standardDurationMinutes: duration
            })
            
            if (result.success) {
                toast.success("Configuración guardada")
                setOpen(false)
            } else {
                toast.error("Error al guardar")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                    <Settings className="w-4 h-4" />
                    <span>Configuración</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Tiempo Estándar de Reservación
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* INFO BOX */}
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl space-y-2">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                            <div className="text-sm text-gray-300">
                                <p className="font-medium text-blue-400 mb-1">
                                    {enabled ? 'Modo Estándar Activado' : 'Modo Bloqueo Diario'}
                                </p>
                                {enabled ? (
                                    <p>
                                        Las mesas se bloquearán por <strong>{hours}h {minutes > 0 && `${minutes}m`}</strong> después de la reserva.
                                        Esto permite recibir múltiples turnos en una misma mesa.
                                    </p>
                                ) : (
                                    <p>
                                        Al no definir un tiempo, cada reserva <strong>bloqueará la mesa durante todo el día</strong>.
                                        Ideal para eventos exclusivos o si solo manejas un turno.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* TOGGLE */}
                    <div 
                        className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors"
                        onClick={() => setEnabled(!enabled)}
                    >
                        <div className="space-y-1">
                            <Label className="text-base font-medium text-white cursor-pointer">Activar Tiempo Estándar</Label>
                            <p className="text-xs text-gray-500">Permitir múltiples reservas por mesa</p>
                        </div>
                        <Switch 
                            checked={enabled}
                            onCheckedChange={setEnabled}
                            className="data-[state=checked]:bg-amber-500"
                        />
                    </div>

                    {/* DURATION SLIDER (Only if enabled) */}
                    <div className={cn(
                        "space-y-4 transition-all duration-300 overflow-hidden",
                        enabled ? "opacity-100 max-h-[200px]" : "opacity-30 max-h-0 pointer-events-none"
                    )}>
                        <div className="flex justify-between items-center px-1">
                            <Label className="text-sm font-medium text-gray-300">Duración de la Estancia</Label>
                            <span className="text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full text-sm">
                                {hours} horas {minutes > 0 ? `${minutes} min` : ''}
                            </span>
                        </div>
                        
                        <div className="px-2">
                            <Slider
                                defaultValue={[duration]}
                                max={480} // 8 hours
                                min={30}  // 30 min
                                step={30}
                                value={[duration]}
                                onValueChange={(val) => setDuration(val[0])}
                                className="my-4"
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 uppercase font-bold tracking-wider">
                                <span>30 min</span>
                                <span>4 horas</span>
                                <span>8 horas</span>
                            </div>
                        </div>

                        {duration < 90 && (
                            <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 p-2 rounded-lg">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Cuidado: Menos de 1.5h podría apresurar a los clientes.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-zinc-800 text-gray-400">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isPending} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                        {isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

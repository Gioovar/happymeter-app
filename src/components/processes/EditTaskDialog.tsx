"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Clock, Camera, Video, Save } from "lucide-react"
import { toast } from "sonner"
import { updateProcessTask } from "@/actions/processes-mutations"

interface Task {
    id: string
    title: string
    description: string | null
    limitTime: string | null
    evidenceType: string
}

interface EditTaskDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task: Task | null
    onSuccess: () => void
}

export default function EditTaskDialog({ open, onOpenChange, task, onSuccess }: EditTaskDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [limitTime, setLimitTime] = useState("")
    const [evidenceType, setEvidenceType] = useState<"PHOTO" | "VIDEO" | "BOTH">("PHOTO")

    const [days, setDays] = useState<string[]>([])

    // Day options
    const dayOptions = [
        { id: "Mon", label: "L" },
        { id: "Tue", label: "M" },
        { id: "Wed", label: "X" },
        { id: "Thu", label: "J" },
        { id: "Fri", label: "V" },
        { id: "Sat", label: "S" },
        { id: "Sun", label: "D" },
    ]

    useEffect(() => {
        if (task && open) {
            setTitle(task.title || "")
            setDescription(task.description || "")
            setLimitTime(task.limitTime || "")
            setEvidenceType((task.evidenceType as "PHOTO" | "VIDEO" | "BOTH") || "PHOTO")
            // Assuming task.days exists. If not, default to empty or all days based on logic.
            // For now, let's assume it comes from the task object.
            setDays((task as any).days || [])
        }
    }, [task, open])

    const toggleDay = (dayId: string) => {
        setDays(current =>
            current.includes(dayId)
                ? current.filter(d => d !== dayId)
                : [...current, dayId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!task) return

        if (!title.trim()) {
            toast.error("El título es requerido")
            return
        }

        // Validate time format if present
        if (limitTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(limitTime)) {
            toast.error("Formato de hora inválido (HH:MM)")
            return
        }

        setIsSubmitting(true)
        try {
            await updateProcessTask({
                taskId: task.id,
                title,
                description,
                limitTime,
                evidenceType,
                days
            })

            toast.success("Tarea actualizada correctamente")
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Error al actualizar tarea")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Tarea</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Modifica los detalles de esta tarea operativa.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Título de la Tarea</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej. Limpiar Barra"
                            className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Instrucciones / Descripción</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalles sobre qué hacer..."
                            className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50 min-h-[80px]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-orange-400" /> Hora Límite
                            </Label>
                            <Input
                                value={limitTime}
                                onChange={(e) => setLimitTime(e.target.value)}
                                placeholder="14:00"
                                className="bg-white/5 border-white/10 text-white focus:border-cyan-500/50"
                            />
                            <p className="text-[10px] text-gray-500">Opcional (Formato 24h)</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo de Evidencia</Label>
                            <Select value={evidenceType} onValueChange={(v) => setEvidenceType(v as "PHOTO" | "VIDEO" | "BOTH")}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                    <SelectItem value="PHOTO">
                                        <div className="flex items-center gap-2">
                                            <Camera className="w-3 h-3 text-purple-400" /> Foto
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="VIDEO">
                                        <div className="flex items-center gap-2">
                                            <Video className="w-3 h-3 text-blue-400" /> Video
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="BOTH">
                                        <div className="flex items-center gap-2">
                                            <Camera className="w-3 h-3 text-purple-400" />
                                            <span className="text-gray-500">+</span>
                                            <Video className="w-3 h-3 text-blue-400" />
                                            <span className="ml-1">Ambas</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Day Selection */}
                    <div className="space-y-2">
                        <Label>Días Activos</Label>
                        <div className="flex justify-between gap-1">
                            {dayOptions.map((day) => {
                                const isSelected = days.includes(day.id)
                                return (
                                    <button
                                        type="button"
                                        key={day.id}
                                        onClick={() => toggleDay(day.id)}
                                        className={`
                                            w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border
                                            ${isSelected
                                                ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)] transform scale-105"
                                                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                            }
                                        `}
                                    >
                                        {day.label}
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-[10px] text-gray-500 text-right">
                            {days.length === 0 ? "Todos los días (Por defecto)" : `${days.length} días seleccionados`}
                        </p>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

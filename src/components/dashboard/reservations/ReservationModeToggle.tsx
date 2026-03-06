"use client"

import { useState } from "react"
import { updateReservationSettings } from "@/actions/reservations"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { LayoutGrid, CalendarRange, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"

export function ReservationModeToggle({ currentMode }: { currentMode: 'SIMPLE' | 'ADVANCED' }) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const [targetMode, setTargetMode] = useState<'SIMPLE' | 'ADVANCED'>('SIMPLE')

    const requestToggle = (mode: 'SIMPLE' | 'ADVANCED') => {
        if (mode === currentMode) return;
        setTargetMode(mode)
        setConfirmModalOpen(true)
    }

    const confirmToggle = async () => {
        setIsUpdating(true)
        setConfirmModalOpen(false)
        try {
            // we don't know the full settings object here, but updateReservationSettings in the backend 
            // does an upsert and might overwrite. Actually, we should call a specific server action to update ONLY this field,
            // or fetch current settings here. 
            // For now, let's create a dedicated server action in a moment or use fetch to an API.
            // Wait, we can fetch current settings from the page and pass it, or we can just send the delta to a server action.

            // To ensure we don't wipe out other settings, we will call an API endpoint.
            const res = await fetch('/api/reservations/toggle-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ simpleMode: targetMode === 'SIMPLE' })
            })

            if (res.ok) {
                toast.success(`Sistema cambiado a modo ${targetMode === 'SIMPLE' ? 'Sencillo' : 'Avanzado'}`)
                window.location.reload()
            } else {
                toast.error("Error al cambiar de sistema")
            }
        } catch (e) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <>
            <div className="flex bg-[#111] p-1 rounded-xl border border-white/10 items-center">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => requestToggle('SIMPLE')}
                    disabled={isUpdating}
                    className={`rounded-lg px-4 flex items-center gap-2 transition-all ${currentMode === 'SIMPLE' ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <CalendarRange className="w-4 h-4" />
                    Sencillo
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => requestToggle('ADVANCED')}
                    disabled={isUpdating}
                    className={`rounded-lg px-4 flex items-center gap-2 transition-all ${currentMode === 'ADVANCED' ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <LayoutGrid className="w-4 h-4" />
                    Avanzado
                </Button>
            </div>

            <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                <DialogContent className="bg-[#111] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>¿Cambiar Sistema de Reservaciones?</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Estás a punto de cambiar al modo {targetMode === 'SIMPLE' ? 'Sencillo (Lista y Fechas)' : 'Avanzado (Mapa Interactivo)'}.
                            Tus clientes verán esta nueva interfaz al intentar reservar.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="ghost" onClick={() => setConfirmModalOpen(false)} className="hover:bg-white/10">Cancelar</Button>
                        <Button onClick={confirmToggle} className="bg-violet-600 hover:bg-violet-700 text-white">
                            Confirmar Cambio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

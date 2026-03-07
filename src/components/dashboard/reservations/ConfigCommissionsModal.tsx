"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings } from "lucide-react"
import { updateCommissionSettings } from "@/actions/promoters"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ConfigCommissionsModalProps {
    currentCommission: number
}

export function ConfigCommissionsModal({ currentCommission }: ConfigCommissionsModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [amount, setAmount] = useState(currentCommission.toString())
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const res = await updateCommissionSettings(parseFloat(amount) || 0)

        if (res.success) {
            toast.success('Configuración actualizada correctamente')
            setOpen(false)
            router.refresh()
        } else {
            toast.error(res.error || 'Error al actualizar')
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10 gap-2">
                    <Settings className="w-4 h-4" />
                    Configurar Comisiones
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-amber-500" />
                        Comisión Base Global
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>¿Cuánto pagas base por persona? ($)</Label>
                        <Input
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Ej. 50"
                            type="number"
                            className="bg-zinc-900 border-white/10"
                            required
                        />
                        <p className="text-xs text-zinc-500">
                            Esto se usará como referencia métrica en el dashboard, aunque cada RP tenga su acuerdo.
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                            disabled={loading || amount === ''}
                        >
                            {loading ? 'Guardando...' : 'Guardar Configuración'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

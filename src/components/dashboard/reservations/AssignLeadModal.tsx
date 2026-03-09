"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { ShieldAlert, ShieldCheck } from "lucide-react"
import { togglePromoterRole } from "@/actions/promoters"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AssignLeadModalProps {
    promoters: any[]
}

export function AssignLeadModal({ promoters }: AssignLeadModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedPromoterId, setSelectedPromoterId] = useState<string>("")
    const router = useRouter()

    const selectedPromoter = promoters.find(p => p.id === selectedPromoterId)

    const handleToggleRole = async () => {
        if (!selectedPromoter) return
        setLoading(true)

        const newRole = selectedPromoter.role === 'JEFE_RP' ? 'RP' : 'JEFE_RP'

        const res = await togglePromoterRole(selectedPromoter.id, newRole)

        if (res.success) {
            toast.success(`Rol actualizado a ${newRole === 'JEFE_RP' ? 'Jefe de RPs' : 'RP'}`)
            setOpen(false)
            router.refresh()
            setSelectedPromoterId("")
        } else {
            toast.error(res.error || "Error al actualizar")
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Asignar Jefe de RPs
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-indigo-500" />
                        Gestionar Jefe de RPs
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Selecciona a un promotor para promoverlo a Jefe de RPs o para removerle dicho nivel.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Seleccionar Promotor</Label>
                        <Select value={selectedPromoterId} onValueChange={setSelectedPromoterId}>
                            <SelectTrigger className="bg-zinc-900 border-white/10">
                                <SelectValue placeholder="Busca en tu lista de RPs..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-60">
                                {promoters.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{p.name}</span>
                                            {p.role === 'JEFE_RP' && (
                                                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded uppercase font-bold">Líder</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedPromoter && (
                        <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 space-y-2 mt-4 text-sm text-zinc-300">
                            <p><strong>Actual:</strong> {selectedPromoter.role === 'JEFE_RP' ? 'Jefe de Equipo (Líder)' : 'Promotor (RP)'}</p>
                            <p className="text-zinc-500">
                                {selectedPromoter.role === 'JEFE_RP'
                                    ? "Al removerle el puesto, perderá acceso a la gestión de su equipo desde la app."
                                    : "Al promoverlo, obtendrá una pestaña nueva en la app para reclutar y gestionar a otros RPs."}
                            </p>
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button
                            onClick={handleToggleRole}
                            disabled={!selectedPromoter || loading}
                            className={`w-full ${selectedPromoter?.role === 'JEFE_RP' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                        >
                            {loading ? "Guardando..." : selectedPromoter?.role === 'JEFE_RP' ? 'Remover Rol de Jefe' : 'Convertir en Jefe de RPs'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

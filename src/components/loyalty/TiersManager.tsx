"use client"

import { useState } from "react"
import { Plus, X, Pencil, Crown, Trash2, Check } from "lucide-react"
import { toast } from "sonner"
import { createLoyaltyTier, updateLoyaltyTier, deleteLoyaltyTier } from "@/actions/loyalty"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TiersManagerProps {
    programId: string
    tiers: any[]
}

export default function TiersManager({ programId, tiers }: TiersManagerProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [editingTier, setEditingTier] = useState<any | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        requiredVisits: 5,
        requiredPoints: 1000,
        color: "#fbbf24", // Default gold-ish
        order: 1
    })

    const resetForm = () => {
        setFormData({
            name: "",
            requiredVisits: 5,
            requiredPoints: 1000,
            color: "#fbbf24",
            order: tiers.length + 1
        })
        setEditingTier(null)
    }

    const handleOpenCreate = () => {
        resetForm()
        setIsCreating(true)
    }

    const handleOpenEdit = (tier: any) => {
        setEditingTier(tier)
        setFormData({
            name: tier.name,
            requiredVisits: tier.requiredVisits,
            requiredPoints: tier.requiredPoints,
            color: tier.color,
            order: tier.order
        })
        setIsCreating(true)
    }

    const handleSubmit = async () => {
        if (!formData.name) return toast.error("El nombre es requerido")

        setIsSubmitting(true)
        try {
            let res
            if (editingTier) {
                res = await updateLoyaltyTier(programId, editingTier.id, formData)
            } else {
                res = await createLoyaltyTier(programId, formData)
            }

            if (res.success) {
                toast.success(editingTier ? "Nivel actualizado" : "Nivel creado")
                setIsCreating(false)
                resetForm()
            } else {
                toast.error(res.error || "Error al guardar el nivel")
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (tierId: string) => {
        if (!confirm("¿Estás seguro de eliminar este nivel?")) return

        const res = await deleteLoyaltyTier(programId, tierId)
        if (res.success) {
            toast.success("Nivel eliminado")
        } else {
            toast.error("Error al eliminar el nivel")
        }
    }

    return (
        <div className="bg-[#111] p-8 rounded-3xl border border-white/10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Niveles VIP</h3>
                    <p className="text-gray-400 text-sm mt-1">Configura los beneficios por fidelidad.</p>
                </div>
                <Button
                    onClick={handleOpenCreate}
                    className="bg-white text-black hover:bg-gray-200"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Nivel
                </Button>
            </div>

            <div className="space-y-4">
                {(tiers || []).sort((a, b) => a.order - b.order).map((tier) => (
                    <div
                        key={tier.id}
                        className="bg-[#16161e] border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 shadow-lg"
                                style={{ backgroundColor: `${tier.color}20`, borderColor: `${tier.color}40` }}
                            >
                                <Crown className="w-6 h-6" style={{ color: tier.color }} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">{tier.name}</h4>
                                <div className="text-xs text-gray-400 flex gap-3">
                                    <span>{tier.requiredVisits} Visitas</span>
                                    <span className="text-gray-600">•</span>
                                    <span>{tier.requiredPoints} Puntos</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenEdit(tier)}
                                className="text-gray-400 hover:text-white hover:bg-white/10"
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(tier.id)}
                                className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {(!tiers || tiers.length === 0) && (
                    <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Crown className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay niveles configurados aún.</p>
                    </div>
                )}
            </div>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="bg-[#111] border-white/10 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingTier ? "Editar Nivel" : "Nuevo Nivel VIP"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nombre del Nivel</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej. Oro"
                                className="bg-white/5 border-white/10 text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="visits">Visitas Requeridas</Label>
                                <Input
                                    id="visits"
                                    type="number"
                                    value={formData.requiredVisits}
                                    onChange={(e) => setFormData({ ...formData, requiredVisits: parseInt(e.target.value) || 0 })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="points">Puntos Requeridos</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    value={formData.requiredPoints}
                                    onChange={(e) => setFormData({ ...formData, requiredPoints: parseInt(e.target.value) || 0 })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="color">Color de la Tarjeta</Label>
                            <div className="flex gap-4 items-center">
                                <div
                                    className="w-12 h-12 rounded-full border-2 border-white/20 shadow-inner"
                                    style={{ backgroundColor: formData.color }}
                                />
                                <Input
                                    id="color"
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="bg-transparent border-0 w-20 p-0 h-10 cursor-pointer"
                                />
                                <span className="text-xs text-gray-500 font-mono">{formData.color}</span>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="order">Prioridad (Orden)</Label>
                            <Input
                                id="order"
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="1 = Nivel más bajo"
                            />
                            <p className="text-[10px] text-gray-500">
                                1 es el nivel inicial, luego 2, 3, etc.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsCreating(false)} className="hover:bg-white/10 hover:text-white">
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-white text-black hover:bg-gray-200">
                            {isSubmitting ? "Guardando..." : "Guardar Nivel"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

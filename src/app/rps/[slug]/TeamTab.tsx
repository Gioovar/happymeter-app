"use client"

import { useState } from "react"
import { Users, Plus, DollarSign, UserCheck, Activity, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { createTeamPromoter, updatePromoterCommission } from "@/actions/promoters"

interface TeamMember {
    id: string
    name: string
    phone: string | null
    email: string | null
    slug: string
    commissionType: 'PER_PERSON' | 'PERCENTAGE'
    commissionValue: number
    confirmedAttendees: number
    totalCommission: number
}

interface TeamTabProps {
    leaderSlug: string
    teamData: TeamMember[]
}

export function TeamTab({ leaderSlug, teamData }: TeamTabProps) {
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedRP, setSelectedRP] = useState<TeamMember | null>(null)
    const [loading, setLoading] = useState(false)

    // Add Form State
    const [addForm, setAddForm] = useState({
        name: "",
        phone: "",
        email: "",
        commissionType: "PER_PERSON" as "PER_PERSON" | "PERCENTAGE",
        commissionValue: 10
    })

    // Edit Form State
    const [editCommission, setEditCommission] = useState(0)

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const res = await createTeamPromoter({
            name: addForm.name,
            phone: addForm.phone,
            email: addForm.email,
            commissionType: addForm.commissionType,
            commissionValue: addForm.commissionValue
        }, leaderSlug)

        if (res.success) {
            toast.success("Promotor añadido a tu equipo")
            setIsAddOpen(false)
            setAddForm({ name: "", phone: "", email: "", commissionType: "PER_PERSON", commissionValue: 10 })
        } else {
            toast.error(res.error || "Error al añadir promotor")
        }
        setLoading(false)
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRP) return
        setLoading(true)
        const res = await updatePromoterCommission(selectedRP.id, editCommission, leaderSlug)

        if (res.success) {
            toast.success("Comisión actualizada")
            setIsEditOpen(false)
        } else {
            toast.error(res.error || "Error al actualizar")
        }
        setLoading(false)
    }

    const openEditModal = (rp: TeamMember) => {
        setSelectedRP(rp)
        setEditCommission(rp.commissionValue)
        setIsEditOpen(true)
    }

    const totalTeamAttendees = teamData.reduce((acc, curr) => acc + curr.confirmedAttendees, 0)
    const totalTeamCommission = teamData.reduce((acc, curr) => acc + curr.totalCommission, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        Mi Equipo ({teamData.length})
                    </h2>
                    <p className="text-sm text-zinc-400">Gestiona a tus RPs y monitorea sus resultados.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Agregar RP
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-sm font-medium text-zinc-500">Asistentes Generados (Equipo)</p>
                            <UserCheck className="h-4 w-4 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-zinc-100">{totalTeamAttendees}</h2>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-white/5 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-sm font-medium text-zinc-500">Comisiones Compartidas</p>
                            <DollarSign className="h-4 w-4 text-blue-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-zinc-100">${totalTeamCommission.toLocaleString()}</h2>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-zinc-900 border-white/5">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-100">Ranking del Equipo</CardTitle>
                    <CardDescription className="text-zinc-400">Rendimiento individual de tus promotores</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                        {teamData.sort((a, b) => b.confirmedAttendees - a.confirmedAttendees).map((rp, index) => (
                            <div key={rp.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-300">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-zinc-100">{rp.name}</h4>
                                        <p className="text-sm text-zinc-500">{rp.phone || rp.email || 'Sin contacto'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 sm:gap-8">
                                    <div className="text-right">
                                        <p className="text-sm text-zinc-400">Asistentes</p>
                                        <p className="font-bold text-emerald-400">{rp.confirmedAttendees}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-zinc-400">Comisión Base</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white">
                                                {rp.commissionType === 'PER_PERSON' ? `$${rp.commissionValue}` : `${rp.commissionValue}%`}
                                            </p>
                                            <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full hover:bg-white/10" onClick={() => openEditModal(rp)}>
                                                <Edit2 className="w-3 h-3 text-zinc-400" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {teamData.length === 0 && (
                            <div className="p-8 text-center text-zinc-500">
                                Aún no tienes a nadie en tu equipo. Agrega tu primer RP para empezar.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Add RP Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Añadir Promotor a tu Equipo</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Llena los datos para crear una cuenta a un nuevo RP. Quedará asignado a tu mando.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre / Alias</Label>
                            <Input id="name" required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="bg-zinc-900 border-zinc-800" placeholder="Ej. Juan Pérez" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono (WhatsApp)</Label>
                                <Input id="phone" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className="bg-zinc-900 border-zinc-800" placeholder="Ej. 55..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo (Opcional)</Label>
                                <Input id="email" type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="bg-zinc-900 border-zinc-800" placeholder="correo@..." />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo Comisión</Label>
                                <Select value={addForm.commissionType} onValueChange={(val: any) => setAddForm({ ...addForm, commissionType: val })}>
                                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                        <SelectItem value="PER_PERSON">Por Persona ($)</SelectItem>
                                        <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor Comisión</Label>
                                <Input type="number" step="0.5" required value={addForm.commissionValue} onChange={(e) => setAddForm({ ...addForm, commissionValue: parseFloat(e.target.value) })} className="bg-zinc-900 border-zinc-800" />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {loading ? "Guardando..." : "Crear RP"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Commission Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Ajustar Comisión</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Modifica lo que se le pagará a {selectedRP?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Valor {selectedRP?.commissionType === 'PER_PERSON' ? '($ por persona)' : '(%)'}</Label>
                            <Input type="number" step="0.5" required value={editCommission} onChange={(e) => setEditCommission(parseFloat(e.target.value))} className="bg-zinc-900 border-zinc-800 text-xl font-bold h-12" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {loading ? "Guardando..." : "Actualizar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

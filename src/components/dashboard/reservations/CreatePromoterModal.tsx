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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Plus, Target, Users } from "lucide-react"
import { createPromoter } from "@/actions/promoters"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CreatePromoterModalProps {
    branches: { id: string, name: string }[]
}

export function CreatePromoterModal({ branches }: CreatePromoterModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        commissionType: 'PER_PERSON',
        commissionValue: '',
        branchId: '',
        slug: ''
    })

    const generateSlug = (name: string) => {
        return name.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const res = await createPromoter({
            ...form,
            commissionType: form.commissionType as any,
            commissionValue: parseFloat(form.commissionValue) || 0,
            slug: form.slug || generateSlug(form.name)
        })

        if (res.success) {
            toast.success('RP creado correctamente')
            setOpen(false)
            router.refresh()
            setForm({
                name: '',
                phone: '',
                email: '',
                commissionType: 'PER_PERSON',
                commissionValue: '',
                branchId: '',
                slug: ''
            })
        } else {
            toast.error(res.error)
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
                    <Plus className="w-4 h-4" />
                    Crear Nuevo RP
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" />
                        Registrar Nuevo Promotor (RP)
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Nombre Completo</Label>
                        <Input
                            value={form.name}
                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ej. Juan Pérez"
                            className="bg-zinc-900 border-white/10"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <Input
                                value={form.phone}
                                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="5512345678"
                                className="bg-zinc-900 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Código / Slug</Label>
                            <Input
                                value={form.slug}
                                onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                                placeholder="juan-rp"
                                className="bg-zinc-900 border-white/10"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Correo Electrónico</Label>
                        <Input
                            value={form.email}
                            onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="juan@ejemplo.com"
                            className="bg-zinc-900 border-white/10"
                            type="email"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Sucursal Asignada</Label>
                        <Select onValueChange={v => setForm(prev => ({ ...prev, branchId: v }))}>
                            <SelectTrigger className="bg-zinc-900 border-white/10">
                                <SelectValue placeholder="Seleccionar sucursal" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                {branches.map(b => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                        <div className="space-y-2">
                            <Label>Esquema de Pago</Label>
                            <Select
                                value={form.commissionType}
                                onValueChange={v => setForm(prev => ({ ...prev, commissionType: v }))}
                            >
                                <SelectTrigger className="bg-zinc-900 border-white/10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="PER_PERSON">Por Persona ($)</SelectItem>
                                    <SelectItem value="PERCENTAGE">Porcentaje (%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Valor Comisión</Label>
                            <Input
                                value={form.commissionValue}
                                onChange={e => setForm(prev => ({ ...prev, commissionValue: e.target.value }))}
                                placeholder="50 o 10"
                                type="number"
                                className="bg-zinc-900 border-white/10"
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-500"
                            disabled={loading}
                        >
                            {loading ? 'Creando...' : 'Guardar RP'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

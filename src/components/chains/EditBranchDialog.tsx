'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Loader2, Globe } from 'lucide-react'
import { updateBranch } from '@/actions/chain'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface EditBranchDialogProps {
    branchId: string
    currentName: string
    currentCountry?: string
}

// List of common Latin American countries + US/Spain as requested often
const COUNTRIES = [
    "Argentina",
    "Bolivia",
    "Chile",
    "Colombia",
    "Costa Rica",
    "Ecuador",
    "El Salvador",
    "España",
    "Estados Unidos",
    "Guatemala",
    "Honduras",
    "México",
    "Nicaragua",
    "Panamá",
    "Paraguay",
    "Perú",
    "República Dominicana",
    "Uruguay",
    "Venezuela"
]

export function EditBranchDialog({ branchId, currentName, currentCountry }: EditBranchDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(currentName)
    const [country, setCountry] = useState(currentCountry || '')
    const router = useRouter()

    const handleSave = async () => {
        if (!name.trim()) return toast.error('El nombre es obligatorio')

        setLoading(true)
        try {
            const res = await updateBranch(branchId, {
                name,
                country: country || undefined
            })

            if (res.success) {
                toast.success('Sucursal actualizada correctamente')
                setOpen(false)
                router.refresh()
            } else {
                throw new Error(res.error || 'Error desconocido')
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white/20 transition-colors"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Sucursal</DialogTitle>
                    <DialogDescription>
                        Modifica el nombre y la ubicación de esta sucursal.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Sucursal</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-900 border-white/10 focus:ring-violet-500"
                            placeholder="Ej. Sede Central"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="country">País / Ubicación</Label>
                        <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="bg-zinc-900 border-white/10 focus:ring-violet-500">
                                <SelectValue placeholder="Selecciona un país" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                {COUNTRIES.map((c) => (
                                    <SelectItem key={c} value={c} className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="border-white/10 hover:bg-white/5 hover:text-white text-gray-400"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { addBranch, createChain } from '@/actions/chain'
import { Loader2, Plus, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface CreateBranchModalProps {
    chainId?: string
    isFirstChain?: boolean // If true, we are upgrading the user to a chain
    trigger?: React.ReactNode
}

export default function CreateBranchModal({ chainId, isFirstChain = false, trigger }: CreateBranchModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: '',
        email: '', // Only for valid new branches
        chainName: '' // Only for first chain creation
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isFirstChain) {
                // 1. Create Chain
                const res = await createChain(formData.chainName)
                if (!res.success) throw new Error(res.error)

                toast.success('Cadena creada exitosamente')
                router.refresh()
                setOpen(false)
            } else {
                // 2. Add Branch
                if (!chainId) throw new Error('No Chain ID provided')

                const res = await addBranch(chainId, {
                    name: formData.name,
                    email: formData.email
                })

                if (!res.success) throw new Error(res.error)

                toast.success('Sucursal creada exitosamente')
                router.refresh()
                setOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al procesar solicitud')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        {isFirstChain ? 'Crear Cadena' : 'Nueva Sucursal'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isFirstChain ? 'Crear mi Cadena' : 'Nueva Sucursal'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isFirstChain ? (
                        <div className="space-y-2">
                            <Label>Nombre de la Cadena</Label>
                            <Input
                                placeholder="Ej. Grupo Restaurantero MX"
                                value={formData.chainName}
                                onChange={(e) => setFormData({ ...formData, chainName: e.target.value })}
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                Tu negocio actual se convertirá en la sucursal principal.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Nombre de Sucursal</Label>
                                <Input
                                    placeholder="Ej. Sucursal Norte"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email del Encargado (Opcional)</Label>
                                <Input
                                    type="email"
                                    placeholder="sucursal.norte@empresa.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Déjalo vacío si tú administrarás esta sucursal por ahora. Podrás invitar a un gerente después.
                                </p>
                            </div>
                        </>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isFirstChain ? 'Actualizar a Cadena' : 'Crear Sucursal'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}

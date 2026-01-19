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
import { BranchPurchaseModal } from './BranchPurchaseModal'

interface CreateBranchModalProps {
    chainId?: string
    isFirstChain?: boolean // If true, we are upgrading the user to a chain
    trigger?: React.ReactNode
    triggerClassName?: string
}

export default function CreateBranchModal({ chainId, isFirstChain = false, trigger, triggerClassName }: CreateBranchModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Show intro step only if it is the first chain creation
    const [showIntro, setShowIntro] = useState(isFirstChain)

    const [formData, setFormData] = useState({
        name: '',
        email: '', // Only for valid new branches
        chainName: '' // Only for first chain creation
    })

    const [showPurchaseModal, setShowPurchaseModal] = useState(false)

    // Helper to calculate current branch count if needed, 
    // but the server action is the final authority.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isFirstChain) {
                // 1. Create Chain
                const res = await createChain(formData.chainName)
                if (!res.success) {
                    if (res.error === 'LIMIT_REACHED' || (res as any).code === 'LIMIT_REACHED') {
                        setOpen(false)
                        setShowPurchaseModal(true)
                        return // Stop here
                    }
                    throw new Error(res.error)
                }

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

                if (!res.success) {
                    if (res.error === 'LIMIT_REACHED' || (res as any).code === 'LIMIT_REACHED') {
                        setOpen(false)
                        setShowPurchaseModal(true)
                        return // Stop here
                    }
                    throw new Error(res.error)
                }

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
                {trigger ? trigger : triggerClassName ? (
                    <button className={triggerClassName}>
                        <span className="sr-only">Crear Sucursal</span>
                    </button>
                ) : (
                    <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
                        <Plus className="w-4 h-4 mr-2" />
                        {isFirstChain ? 'Crear Cadena' : 'Nueva Sucursal'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                <DialogHeader className="space-y-3 pb-4 border-b border-white/5">
                    <div className="mx-auto w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20 mb-2">
                        <Store className="w-6 h-6 text-violet-400" />
                    </div>
                    <DialogTitle className="text-xl text-center font-bold tracking-tight">
                        {isFirstChain ? 'Configura tu Cadena' : 'Nueva Sucursal'}
                    </DialogTitle>
                    <p className="text-center text-sm text-gray-400">
                        {isFirstChain
                            ? 'Transforma tu negocio en una cadena multi-sucursal.'
                            : 'Expande tu negocio agregando una nueva ubicación.'}
                    </p>
                </DialogHeader>

                {isFirstChain && showIntro ? (
                    <div className="p-6 space-y-6 text-center">
                        <div className="space-y-4">
                            <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 p-4 rounded-xl border border-violet-500/20">
                                <h3 className="text-white font-medium mb-2">¡Felicidades por tu crecimiento! 🚀</h3>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Estás a punto de convertir tu negocio en una <strong className="text-violet-400">Cadena de Sucursales</strong>.
                                </p>
                            </div>

                            <ul className="text-left space-y-3 px-2">
                                <li className="flex items-start gap-3 text-sm text-gray-300">
                                    <div className="p-1 bg-white/5 rounded-md mt-0.5">
                                        <Store className="w-3 h-3 text-white" />
                                    </div>
                                    <span>Obtendrás un nuevo <strong>Panel de Dueño</strong> para gestionar todas tus ubicaciones.</span>
                                </li>
                                <li className="flex items-start gap-3 text-sm text-gray-300">
                                    <div className="p-1 bg-white/5 rounded-md mt-0.5">
                                        <Plus className="w-3 h-3 text-white" />
                                    </div>
                                    <span>Podrás navegar entre sucursales sin perder el contexto.</span>
                                </li>
                            </ul>
                        </div>

                        <Button
                            className="w-full bg-white text-black hover:bg-gray-200"
                            onClick={() => setShowIntro(false)}
                        >
                            Comenzar Configuración
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4 px-6 pb-6">
                        {isFirstChain ? (
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">
                                    Nombre de la Cadena
                                </Label>
                                <Input
                                    placeholder="Ej. Grupo Restaurantero MX"
                                    value={formData.chainName}
                                    onChange={(e) => setFormData({ ...formData, chainName: e.target.value })}
                                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-violet-500/20"
                                    required
                                />
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                                    ℹ️ Tu negocio actual se convertirá en la <strong>Sucursal Principal</strong>.
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">
                                        Nombre de Sucursal
                                    </Label>
                                    <Input
                                        placeholder="Ej. Sucursal Norte"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-violet-500/20"
                                        required
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">
                                        Email del Encargado (Opcional)
                                    </Label>
                                    <Input
                                        type="email"
                                        placeholder="sucursal.norte@empresa.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50 focus:ring-violet-500/20"
                                    />
                                    <p className="text-[11px] text-gray-500 ml-1">
                                        Si lo dejas vacío, tú administrarás esta sucursal por defecto.
                                    </p>
                                </div>
                            </>
                        )}

                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/20 transition-all font-medium text-sm"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {isFirstChain ? 'Creando Cadena...' : 'Registrando Sucursal...'}
                                    </>
                                ) : (
                                    isFirstChain ? 'Comenzar Expansión' : 'Crear Sucursal'
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>

            <BranchPurchaseModal
                open={showPurchaseModal}
                onOpenChange={setShowPurchaseModal}
                onSuccess={() => {
                    // When purchase done, maybe reopen the create modal or just refresh?
                    // User probably wants to try creating again.
                    // Let's verify flow.
                    router.refresh()
                    // Ideally we reopen the "Create Branch" modal?
                    // For now just stay closed and let them click + again, now with higher limit.
                }}
                currentBranchCount={0} // We don't really use this prop for validation in modal, just display maybe? Pass 0 for now.
            />
        </Dialog>
    )
}

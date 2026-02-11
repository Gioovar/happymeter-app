'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { deleteBranch } from '@/actions/chain'

interface DeleteBranchDialogProps {
    branchId: string
    branchName: string
}

export function DeleteBranchDialog({ branchId, branchName }: DeleteBranchDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [confirmText, setConfirmText] = useState('')

    const handleDelete = async () => {
        if (confirmText !== 'ELIMINAR') {
            toast.error('Por favor escribe ELIMINAR para confirmar')
            return
        }

        setLoading(true)
        try {
            const res = await deleteBranch(branchId)
            if (res.success) {
                toast.success('Sucursal eliminada correctamente')
                setOpen(false)
                // Optional: router.refresh() if revalidatePath isn't enough for client cache
            } else {
                throw new Error(res.error || 'Error al eliminar')
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
                    className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Eliminar Sucursal"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="w-5 h-5" />
                        Eliminar Sucursal
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Estás a punto de eliminar la sucursal <strong className="text-white">{branchName}</strong>.
                        <br /><br />
                        <span className="text-red-400 block bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-xs">
                            ⚠️ Esta acción es irreversible. Se eliminarán permanentemente todos los datos asociados: encuestas, historial, cuentas de empleados y configuraciones.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-0">
                    <div className="py-4">
                        <label className="text-xs text-gray-500 mb-2 block">
                            Escribe <strong className="text-white">ELIMINAR</strong> para confirmar:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-gray-700"
                            placeholder="ELIMINAR"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                            className="text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading || confirmText !== 'ELIMINAR'}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar Definitivamente'
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

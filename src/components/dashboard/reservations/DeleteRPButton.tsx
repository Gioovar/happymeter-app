"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { deletePromoter } from "@/actions/promoters"

interface DeleteRPButtonProps {
    promoterId: string
    promoterName: string
}

export function DeleteRPButton({ promoterId, promoterName }: DeleteRPButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de eliminar al RP "${promoterName}"?\nSe perderán sus métricas actuales de forma permanente.`)) {
            return
        }

        setIsDeleting(true)
        try {
            const res = await deletePromoter(promoterId)
            if (res.success) {
                toast.success('RP eliminado correctamente')
            } else {
                toast.error(res.error || 'Error al eliminar al RP')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado al eliminar')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
        >
            <Trash2 className="w-4 h-4" /> 
            <span className="sr-only">Eliminar</span>
        </Button>
    )
}

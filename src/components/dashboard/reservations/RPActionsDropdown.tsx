"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Share2, Mail, MessageSquare } from "lucide-react"
import { sendPromoterNotification } from "@/actions/promoters"
import { toast } from "sonner"

interface RPActionsDropdownProps {
    promoterId: string
    promoterSlug: string
}

export function RPActionsDropdown({ promoterId, promoterSlug }: RPActionsDropdownProps) {
    const copyPortalLink = () => {
        const url = `${window.location.origin}/rps/${promoterSlug}`
        navigator.clipboard.writeText(url)
        toast.success('Link del Portal copiado')
    }

    const handleSendNotification = async (type: 'sms' | 'email') => {
        const res: any = await sendPromoterNotification(promoterId, type)
        if (res.success) {
            toast.success(`Notificación enviada por ${type.toUpperCase()}`)
        } else {
            toast.error(res?.error || 'Error al enviar notificación')
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10">
                    <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-300">
                <DropdownMenuItem onClick={copyPortalLink} className="hover:bg-white/5 cursor-pointer flex gap-2">
                    <Share2 className="w-4 h-4" /> Enlace del Portal (para RP)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendNotification('sms')} className="hover:bg-white/5 cursor-pointer flex gap-2">
                    <MessageSquare className="w-4 h-4" /> Enviar App (SMS)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendNotification('email')} className="hover:bg-white/5 cursor-pointer flex gap-2">
                    <Mail className="w-4 h-4" /> Enviar App (Correo)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

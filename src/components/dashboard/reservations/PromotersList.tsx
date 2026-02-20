"use client"

import { useState } from "react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Trash2, ExternalLink, QrCode, Share2, Mail, MessageSquare } from "lucide-react"
import { deletePromoter, sendPromoterNotification } from "@/actions/promoters"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface PromotersListProps {
    initialPromoters: any[]
    programId: string
}

export function PromotersList({ initialPromoters, programId }: PromotersListProps) {
    const [promoters, setPromoters] = useState(initialPromoters)

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este RP? Se perderán sus métricas vinculadas.')) return

        const res = await deletePromoter(id)
        if (res.success) {
            setPromoters(prev => prev.filter(p => p.id !== id))
            toast.success('RP eliminado correctamente')
        } else {
            toast.error(res.error)
        }
    }

    const copyPortalLink = (slug: string) => {
        const url = `${window.location.origin}/rps/${slug}`
        navigator.clipboard.writeText(url)
        toast.success('Link del Portal copiado')
    }

    const copyReservationLink = (slug: string) => {
        const url = `${window.location.origin}/book/${programId}?rp=${slug}`
        navigator.clipboard.writeText(url)
        toast.success('Link de Reservas copiado')
    }

    const handleSendNotification = async (id: string, type: 'sms' | 'email') => {
        const res = await sendPromoterNotification(id, type)
        if (res.success) {
            toast.success(`Notificación enviada por ${type.toUpperCase()}`)
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
            <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-zinc-400">Nombre</TableHead>
                        <TableHead className="text-zinc-400">Contacto</TableHead>
                        <TableHead className="text-zinc-400">Esquema</TableHead>
                        <TableHead className="text-zinc-400">Código/Link</TableHead>
                        <TableHead className="text-zinc-400 text-right">Reservas</TableHead>
                        <TableHead className="text-zinc-400 w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {promoters.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                                No hay RPs registrados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        promoters.map((promoter) => (
                            <TableRow key={promoter.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="font-medium text-white">
                                    {promoter.name}
                                </TableCell>
                                <TableCell className="text-zinc-400 text-sm">
                                    <div className="flex flex-col">
                                        <span>{promoter.phone}</span>
                                        <span className="text-[10px] opacity-50">{promoter.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/5">
                                        {promoter.commissionType === 'PER_PERSON' ? `$${promoter.commissionValue} / pax` : `${promoter.commissionValue}%`}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <code className="bg-black/40 px-2 py-1 rounded text-orange-400 text-xs">
                                        {promoter.slug}
                                    </code>
                                </TableCell>
                                <TableCell className="text-right text-white font-bold">
                                    {promoter._count?.reservations || 0}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/10">
                                                <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-zinc-300">
                                            <DropdownMenuItem onClick={() => copyPortalLink(promoter.slug)} className="hover:bg-white/5 cursor-pointer flex gap-2">
                                                <Share2 className="w-4 h-4" /> Enlace del Portal (para RP)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => copyReservationLink(promoter.slug)} className="hover:bg-white/5 cursor-pointer flex gap-2">
                                                <ExternalLink className="w-4 h-4" /> Enlace de Reservas (clientes)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleSendNotification(promoter.id, 'sms')} className="hover:bg-white/5 cursor-pointer flex gap-2">
                                                <MessageSquare className="w-4 h-4" /> Enviar App (SMS)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleSendNotification(promoter.id, 'email')} className="hover:bg-white/5 cursor-pointer flex gap-2">
                                                <Mail className="w-4 h-4" /> Enviar App (Correo)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link href={`/dashboard/reservations/rps/${promoter.id}`} className="w-full flex gap-2 items-center px-2 py-1.5 hover:bg-white/5 cursor-pointer rounded-sm">
                                                    <ExternalLink className="w-4 h-4" /> Ver Dashboard
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="hover:bg-white/5 cursor-pointer flex gap-2">
                                                <QrCode className="w-4 h-4" /> Descargar QR
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(promoter.id)}
                                                className="hover:bg-red-500/10 text-red-500 cursor-pointer flex gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" /> Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

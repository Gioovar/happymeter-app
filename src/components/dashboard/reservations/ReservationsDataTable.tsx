"use client"

import { useState, useTransition } from "react"
import { Search, Filter, MoreVertical, Edit2, UserX, CheckCircle, XCircle, Clock, FileText, PlusCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateReservationState, updateReservationNotes } from "@/actions/reservations"
import { Loader2 } from "lucide-react"

interface Reservation {
    id: string
    customerName: string
    customerPhone: string | null
    customerEmail: string | null
    partySize: number
    date: Date
    status: string
    notes: string | null
    table: { label: string } | null
}

interface ReservationsDataTableProps {
    data: Reservation[]
}

const STATUS_MAP: Record<string, { label: string, color: string, icon: any }> = {
    'CONFIRMED': { label: 'Confirmada', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle },
    'PENDING': { label: 'Pendiente', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
    'CANCELED': { label: 'Cancelada', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
    'NO_SHOW': { label: 'No Show', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', icon: UserX },
}

export function ReservationsDataTable({ data }: ReservationsDataTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [isPending, startTransition] = useTransition()

    // Notes Modal State
    const [isNotesOpen, setIsNotesOpen] = useState(false)
    const [selectedRes, setSelectedRes] = useState<Reservation | null>(null)
    const [notesText, setNotesText] = useState("")

    const filteredData = data.filter((res) => {
        const matchesSearch =
            res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (res.customerPhone || "").includes(searchTerm)

        const matchesStatus = statusFilter === "ALL" || res.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const handleStatusUpdate = (id: string, newStatus: string) => {
        startTransition(async () => {
            const result = await updateReservationState(id, newStatus)
            if (result.success) {
                toast.success("Estado actualizado")
            } else {
                toast.error("Error al actualizar estado")
            }
        })
    }

    const openNotesModal = (res: Reservation) => {
        setSelectedRes(res)
        setNotesText(res.notes || "")
        setIsNotesOpen(true)
    }

    const handleSaveNotes = () => {
        if (!selectedRes) return
        startTransition(async () => {
            const result = await updateReservationNotes(selectedRes.id, notesText)
            if (result.success) {
                toast.success("Notas guardadas")
                setIsNotesOpen(false)
            } else {
                toast.error("Error al guardar notas")
            }
        })
    }

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#111] p-4 rounded-xl border border-white/5">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar por nombre o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-zinc-900 border-zinc-800 text-white w-full"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Button
                        variant={statusFilter === "ALL" ? "default" : "outline"}
                        className={statusFilter === "ALL" ? "bg-white text-black" : "bg-transparent text-gray-400 border-zinc-800"}
                        onClick={() => setStatusFilter("ALL")}
                    >
                        Todas
                    </Button>
                    {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                        <Button
                            key={key}
                            variant={statusFilter === key ? "default" : "outline"}
                            className={statusFilter === key ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-transparent text-gray-400 border-zinc-800"}
                            onClick={() => setStatusFilter(key)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-zinc-900 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Fecha y Hora</th>
                                <th className="px-6 py-4">Pax / Mesa</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-center">Notas</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron reservaciones con esos filtros.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((res) => {
                                    const statusObj = STATUS_MAP[res.status] || STATUS_MAP['PENDING']
                                    const StatusIcon = statusObj.icon

                                    return (
                                        <tr key={res.id} className="border-b border-white/5 hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-white">{res.customerName}</div>
                                                <div className="text-xs text-zinc-500">{res.customerPhone || 'Sin teléfono'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-white capitalize">
                                                    {format(new Date(res.date), "EEE d 'de' MMM, yyyy", { locale: es })}
                                                </div>
                                                <div className="text-zinc-500 font-medium">
                                                    {format(new Date(res.date), "h:mm a")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white px-2 py-1 bg-zinc-800 rounded-md">
                                                        {res.partySize} pax
                                                    </span>
                                                    {res.table && (
                                                        <span className="text-xs text-zinc-400 bg-white/5 px-2 py-1 rounded">
                                                            {res.table.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusObj.color}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {statusObj.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {res.notes ? (
                                                    <Button variant="ghost" size="sm" onClick={() => openNotesModal(res)} className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                                                        <FileText className="w-4 h-4 mr-1" />
                                                        Ver Notas
                                                    </Button>
                                                ) : (
                                                    <Button variant="ghost" size="sm" onClick={() => openNotesModal(res)} className="text-zinc-500 hover:text-white">
                                                        <PlusCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={isPending} className="text-zinc-400 hover:text-white">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                                                        <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(res.id, 'CONFIRMED')} className="focus:bg-zinc-800 cursor-pointer text-emerald-500">
                                                            <CheckCircle className="w-4 h-4 mr-2" /> Confirmar
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(res.id, 'NO_SHOW')} className="focus:bg-zinc-800 cursor-pointer text-zinc-400">
                                                            <UserX className="w-4 h-4 mr-2" /> Marcar No-Show
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusUpdate(res.id, 'CANCELED')} className="focus:bg-zinc-800 cursor-pointer text-red-500">
                                                            <XCircle className="w-4 h-4 mr-2" /> Cancelar Reserva
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes Modal */}
            <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Notas Internas</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label className="text-zinc-400">Cliente: <span className="text-white font-medium">{selectedRes?.customerName}</span></Label>
                        <Textarea
                            placeholder="Ej. El cliente llamó para avisar que llega 15 mins tarde..."
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white min-h-[120px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNotesOpen(false)} className="hover:bg-zinc-800 text-gray-400">
                            Cerrar
                        </Button>
                        <Button onClick={handleSaveNotes} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Guardar Notas
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

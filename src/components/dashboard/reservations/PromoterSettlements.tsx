"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle2, Clock, DollarSign } from "lucide-react"
import { markSettlementAsPaid } from "@/actions/promoters"
import { toast } from "sonner"

export function PromoterSettlements({ initialSettlements, promoterId }: { initialSettlements: any[], promoterId: string }) {
    const [settlements, setSettlements] = useState(initialSettlements)

    const handleMarkAsPaid = async (id: string) => {
        const res = await markSettlementAsPaid(id)
        if (res.success) {
            setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: 'PAID', paidAt: new Date() } : s))
            toast.success('Liquidación marcada como pagada')
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-500" />
                    Historial de Liquidaciones
                </h3>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-zinc-400">Periodo</TableHead>
                            <TableHead className="text-zinc-400">Monto</TableHead>
                            <TableHead className="text-zinc-400">Estado</TableHead>
                            <TableHead className="text-zinc-400">Fecha Pago</TableHead>
                            <TableHead className="text-zinc-400 text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {settlements.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-zinc-500 text-sm">
                                    No hay liquidaciones generadas aún.
                                </TableCell>
                            </TableRow>
                        ) : (
                            settlements.map((s) => (
                                <TableRow key={s.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="text-zinc-300 text-sm">
                                        {format(new Date(s.startDate), "d MMM", { locale: es })} - {format(new Date(s.endDate), "d MMM", { locale: es })}
                                    </TableCell>
                                    <TableCell className="text-white font-bold">
                                        ${s.amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={s.status === 'PAID' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-amber-500/30 text-amber-400 bg-amber-500/5"}>
                                            {s.status === 'PAID' ? 'Pagado' : 'Pendiente'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-zinc-500 text-xs">
                                        {s.paidAt ? format(new Date(s.paidAt), "d MMM, HH:mm", { locale: es }) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {s.status === 'PENDING' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 h-7 text-[10px]"
                                                onClick={() => handleMarkAsPaid(s.id)}
                                            >
                                                PAGAR
                                            </Button>
                                        )}
                                        {s.status === 'PAID' && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

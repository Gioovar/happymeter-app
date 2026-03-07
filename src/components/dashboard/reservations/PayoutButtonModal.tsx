"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Banknote, CheckCircle2 } from "lucide-react"
import { processPromoterPayout } from "@/actions/promoters"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PayoutButtonModalProps {
    promoterId: string;
    amount: number;
    reservationIds: string[];
}

export function PayoutButtonModal({ promoterId, amount, reservationIds }: PayoutButtonModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [notes, setNotes] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const res = await processPromoterPayout(promoterId, amount, reservationIds, notes)

        if (res.success) {
            toast.success('Pago procesado correctamente')
            setOpen(false)
            router.refresh()
            setNotes("")
        } else {
            toast.error(res.error || 'Error al procesar pago')
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-lg shadow-emerald-900/20 gap-2 h-12 text-lg">
                    <Banknote className="w-5 h-5" />
                    Liquidar Ahora
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        Completar Pago
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Marcarás {reservationIds.length} reservas como pagadas y el RP verá este saldo en su app.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-center">
                        <p className="text-sm text-emerald-300 uppercase tracking-wider font-semibold mb-1">Monto a Liquidar</p>
                        <p className="text-4xl font-bold text-emerald-400">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Concepto / Referencia de Pago (Opcional)</Label>
                        <Input
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ej. Transferencia SPEI #12345"
                            className="bg-zinc-900 border-white/10"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="hover:bg-white/5"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            disabled={loading || amount <= 0}
                        >
                            {loading ? 'Procesando...' : 'Confirmar Pago'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

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
import { Textarea } from "@/components/ui/textarea"
import { CalendarPlus } from "lucide-react"
import { createPromoterEvent } from "@/actions/promoters"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CreateEventModal() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [form, setForm] = useState({
        name: "",
        description: "",
        date: "",
        time: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!form.name || !form.date || !form.time) {
            toast.error("Nombre y Fecha son obligatorios")
            setLoading(false)
            return
        }

        const eventDate = new Date(`${form.date}T${form.time}`)

        const res = await createPromoterEvent({
            name: form.name,
            description: form.description,
            date: eventDate
        })

        if (res.success) {
            toast.success('Evento Publicado para los Promotores ✅')
            setOpen(false)
            router.refresh()
            setForm({ name: "", description: "", date: "", time: "" })
        } else {
            toast.error(res.error || 'Oops, revisa los datos')
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 gap-2">
                    <CalendarPlus className="w-4 h-4" />
                    Publicar Evento RP
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">Nuevo Evento para RPs</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Publica una fecha especial (DJ invitado, Aniversario, etc.) para que tus RPs enfoquen sus ventas.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                    <div className="space-y-2">
                        <Label>Título del Evento</Label>
                        <Input
                            placeholder="Ej. Noche de Reggaeton"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="bg-zinc-900 border-white/10"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha</Label>
                            <Input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="bg-zinc-900 border-white/10"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hora de Inicio</Label>
                            <Input
                                type="time"
                                value={form.time}
                                onChange={(e) => setForm({ ...form, time: e.target.value })}
                                className="bg-zinc-900 border-white/10"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción & Dress Code (Opcional)</Label>
                        <Textarea
                            placeholder="Menciona algún código de vestimenta o cover especial para las listas de invitados..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="bg-zinc-900 border-white/10 h-24"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
                            {loading ? 'Publicando...' : 'Publicar Evento'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

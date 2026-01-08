// @ts-nocheck
"use client"

import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { CustomerProfileDialog } from "./CustomerProfileDialog"

// Mock Data Interfaces
interface Reservation {
    id: number
    name: string
    time: string
    day: string
    date: number
    table: string
    pax: number
    status: string
    rating?: number
    phone?: string
    email?: string
}

export function ReservationsList() {
    const [selectedCustomer, setSelectedCustomer] = useState<Reservation | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Mock Data (matches the visual list)
    const reservations: Reservation[] = [
        { id: 1, day: "ENE", date: 7, name: "Juan Pérez", time: "19:30", table: "Mesa 4", pax: 4, status: "Confirmada", rating: 4.8, phone: "55 1234 5678" },
        { id: 2, day: "ENE", date: 8, name: "Ana López", time: "20:00", table: "Terraza 1", pax: 2, status: "Pendiente", rating: 5.0, phone: "55 9876 5432" },
        { id: 3, day: "ENE", date: 9, name: "Carlos Ruiz", time: "21:15", table: "Barra", pax: 1, status: "Confirmada", rating: 4.2 },
        { id: 4, day: "ENE", date: 10, name: "Sofía Díaz", time: "18:45", table: "Mesa 2", pax: 6, status: "Confirmada", rating: 4.9 }
    ]

    const handleSelect = (res: Reservation) => {
        setSelectedCustomer(res)
        setIsDialogOpen(true)
    }

    return (
        <>
            <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Próximas Reservas</h3>
                    <button className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center">
                        Ver Calendario <ChevronRight className="w-3 h-3 ml-1" />
                    </button>
                </div>

                <div className="space-y-3">
                    {reservations.map((res) => (
                        <div
                            key={res.id}
                            onClick={() => handleSelect(res)}
                            className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-white/10 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-center justify-center w-12 h-12 bg-black rounded-lg border border-white/10 group-hover:border-orange-500/50 transition-colors">
                                    <span className="text-xs text-gray-400 font-bold uppercase">{res.day}</span>
                                    <span className="text-lg font-bold text-white">{res.date < 10 ? `0${res.date}` : res.date}</span>
                                </div>
                                <div>
                                    <h4 className="text-white font-medium group-hover:text-orange-400 transition-colors">{res.name}</h4>
                                    <p className="text-gray-400 text-xs">{res.table} • {res.pax} Personas</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-white font-mono font-medium">{res.time}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${res.status === 'Confirmada' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                                    }`}>
                                    {res.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <CustomerProfileDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                customer={selectedCustomer}
            />
        </>
    )
}

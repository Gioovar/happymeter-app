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
    notes?: string
}

interface ReservationsListProps {
    reservations: any[]
}

export function ReservationsList({ reservations }: ReservationsListProps) {
    const [selectedCustomer, setSelectedCustomer] = useState<Reservation | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Map incoming data to Reservation interface if needed, or assume pre-formatted
    const data = reservations.map((res: any) => {
        let day = "HOY"
        let dateNum = 1
        try {
            const d = new Date(res.date)
            // Invalid Date check
            if (!isNaN(d.getTime())) {
                day = res.day || d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "").toUpperCase().slice(0, 3)
                dateNum = res.dateNum || d.getDate()
            }
        } catch (e) {
            console.error("Date error in list", e)
        }

        return {
            ...res,
            day,
            date: dateNum,
            name: res.customerName || "Cliente",
            table: res.tableName || "Mesa"
        }
    })

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
                    {data.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay reservas próximas
                        </div>
                    ) : (
                        data.map((res: any) => (
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
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${res.status === 'SEATED' ? 'text-emerald-400 bg-emerald-500/10' :
                                            res.status === 'NO_SHOW' ? 'text-red-400 bg-red-500/10' :
                                                res.status === 'CANCELED' ? 'text-gray-400 bg-gray-500/10' :
                                                    'text-amber-400 bg-amber-500/10' // Default / CONFIRMED
                                        }`}>
                                        {
                                            {
                                                'CONFIRMED': 'Confirmada',
                                                'SEATED': 'Asistió',
                                                'NO_SHOW': 'No Asistió',
                                                'CANCELED': 'Cancelada',
                                                'COMPLETED': 'Completada',
                                                'Confirmada': 'Confirmada' // Fallback for existing data
                                            }[res.status as string] || res.status
                                        }
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
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

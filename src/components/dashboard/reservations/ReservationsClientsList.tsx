"use client"

import { useState } from "react"
import { Search, AlertTriangle, ShieldCheck, Phone, User as UserIcon, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ClientData {
    name: string
    phone: string | null
    email: string | null
    totalReservations: number
    noShows: number
    cancellations: number
    lastVisit: Date
    noShowRate: number
    isHighRisk: boolean
}

export function ReservationsClientsList({ clients }: { clients: ClientData[] }) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    )

    return (
        <div className="space-y-4">
            <div className="bg-[#111] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar cliente por nombre o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-zinc-900 border-zinc-800 text-white w-full"
                    />
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                    <div className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-orange-400" /> Perfil de Riesgo: +30% No-Shows</div>
                    <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Cliente Cumplidor</div>
                </div>
            </div>

            <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-zinc-300">
                        <thead className="text-xs text-zinc-500 uppercase bg-zinc-900 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Frecuencia</th>
                                <th className="px-6 py-4">Tasa No-Show</th>
                                <th className="px-6 py-4">Última Visita</th>
                                <th className="px-6 py-4 text-right">Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No hay clientes registrados o la búsqueda no coincide.
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client, i) => (
                                    <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-start gap-3">
                                                <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                                                    <UserIcon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{client.name}</div>
                                                    <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                        <Phone className="w-3 h-3" /> {client.phone || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-white px-2 py-1 bg-zinc-800 rounded-md">
                                                {client.totalReservations} reservas
                                            </span>
                                            <div className="text-xs text-zinc-500 mt-1">
                                                {client.noShows} faltas
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`text-sm font-bold ${client.isHighRisk ? 'text-red-400' : client.noShowRate > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                                    {client.noShowRate}%
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-400">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarDays className="w-3.5 h-3.5" />
                                                {format(new Date(client.lastVisit), "d MMM, yyyy", { locale: es })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {client.isHighRisk ? (
                                                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                                                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Riesgo
                                                </Badge>
                                            ) : client.totalReservations > 1 && client.noShowRate === 0 ? (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Confiable
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
                                                    Regular
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

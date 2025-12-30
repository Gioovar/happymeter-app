"use client"

import { useState } from "react"
import { Search, Crown, History, Star } from "lucide-react"

interface CustomerListProps {
    customers: any[]
}

export function CustomerList({ customers = [] }: CustomerListProps) {
    const [searchTerm, setSearchTerm] = useState("")

    const filtered = customers.filter(c =>
        c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.magicToken?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    )

    return (
        <div className="space-y-6">
            <div className="bg-[#111] p-6 rounded-3xl border border-white/10">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Cartera de Clientes ({customers.length})</h3>
                        <p className="text-gray-400 text-sm">Gestiona y analiza tu base de miembros.</p>
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nombre o ID..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4 font-medium">Cliente</th>
                                <th className="p-4 font-medium">Nivel</th>
                                <th className="p-4 font-medium text-center">Visitas</th>
                                <th className="p-4 font-medium text-center">Puntos</th>
                                <th className="p-4 font-medium text-right">Última Visita</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                                        No se encontraron clientes.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(customer => (
                                    <tr key={customer.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm">
                                                    {customer.firstName || "Sin Nombre"}
                                                </span>
                                                <code className="text-xs text-gray-500 font-mono mt-0.5">
                                                    {customer.magicToken || "ID-MISSING"}
                                                </code>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {customer.tier ? (
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border"
                                                    style={{
                                                        backgroundColor: `${customer.tier.color}15`,
                                                        color: customer.tier.color,
                                                        borderColor: `${customer.tier.color}30`
                                                    }}
                                                >
                                                    <Crown className="w-3 h-3" />
                                                    {customer.tier.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                                                    Miembro
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-bold border border-blue-500/20">
                                                <History className="w-3.5 h-3.5" />
                                                {customer.currentVisits}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-sm font-bold border border-amber-500/20">
                                                <Star className="w-3.5 h-3.5" />
                                                {customer.currentPoints}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right text-sm text-gray-400">
                                            {customer.lastVisitDate ? new Date(customer.lastVisitDate).toLocaleDateString() : "-"}
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

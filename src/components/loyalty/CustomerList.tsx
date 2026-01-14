"use client"

import { useState } from "react"
import { Search, Crown, History, Star } from "lucide-react"

interface CustomerListProps {
    customers: any[]
}

export function CustomerList({ customers = [] }: CustomerListProps) {
    import { LoyaltyCustomerDialog } from "./LoyaltyCustomerDialog"

    // ... existing code

    export function CustomerList({ customers = [] }: CustomerListProps) {
        const [searchTerm, setSearchTerm] = useState("")
        const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
        const [dialogOpen, setDialogOpen] = useState(false)

        // ... existing filter logic

        return (
            <div className="space-y-6">
                <LoyaltyCustomerDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    customerId={selectedCustomer?.id}
                    initialData={selectedCustomer}
                />

                <div className="bg-[#111] p-6 rounded-3xl border border-white/10">
                    {/* ... existing header ... */}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            {/* ... existing thead ... */}
                            <tbody className="divide-y divide-white/5">
                                {filtered.length === 0 ? (
                                    // ... existing empty state ...
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500 text-sm">
                                            No se encontraron clientes.
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(customer => (
                                        <tr
                                            key={customer.id}
                                            onClick={() => {
                                                setSelectedCustomer(customer)
                                                setDialogOpen(true)
                                            }}
                                            className="group hover:bg-white/5 transition-colors cursor-pointer"
                                        >
                                            {/* ... existing cells ... */}
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white text-sm">
                                                        {customer.name || customer.username || "Sin Nombre"}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {customer.phone || customer.email || "Sin contacto"}
                                                    </span>
                                                    <code className="text-[10px] text-gray-600 font-mono mt-0.5">
                                                        {customer.magicToken?.slice(0, 8) || "HIDDEN"}...
                                                    </code>
                                                </div>
                                            </td>

                                            {/* ... Re-inserting other cells implicitly by just wrapping the TR ... 
                                            Wait, replace_file_content replaces the whole block. 
                                            I need to be careful to include the cells.
                                        */}
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

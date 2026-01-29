'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MoreHorizontal, Edit, Trash2, Shield, ExternalLink, Loader2, Zap } from 'lucide-react'
import { updateTenantPlan } from '@/actions/admin'
import { cn } from '@/lib/utils'
import GodModeModal from './GodModeModal'

interface Tenant {
    id: string
    userId: string
    businessName: string | null
    plan: string
    industry: string | null
    createdAt: Date
    stats: {
        surveys: number
        responses: number
    }
    // Optional fields if returned by action, otherwise we rely on Modal fetching or defaults
    maxBranches?: number
    extraSurveys?: number
}

export default function TenantsTable({ initialTenants }: { initialTenants: Tenant[] }) {
    const [tenants, setTenants] = useState(initialTenants)
    const [search, setSearch] = useState('')
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)

    const handlePlanChange = async (userId: string, newPlan: string) => {
        if (!confirm(`Are you sure you want to change this user's plan to ${newPlan}?`)) return

        startTransition(async () => {
            try {
                await updateTenantPlan(userId, newPlan)
                router.refresh()
                // Optimistic update
                setTenants(prev => prev.map(t => t.userId === userId ? { ...t, plan: newPlan } : t))
            } catch (error) {
                alert('Failed to update plan')
            }
        })
    }

    const filteredTenants = tenants.filter(t =>
        t.businessName?.toLowerCase().includes(search.toLowerCase()) ||
        t.userId.includes(search) ||
        t.industry?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <>
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-white/10 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, ID o industria..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-violet-500 outline-none"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-3">Negocio / Usuario</th>
                                <th className="px-6 py-3">Plan Actual</th>
                                <th className="px-6 py-3 text-center">Encuestas</th>
                                <th className="px-6 py-3 text-center">Respuestas</th>
                                <th className="px-6 py-3">Registro</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredTenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white max-w-[200px] truncate" title={tenant.businessName || 'Sin Nombre'}>
                                                {tenant.businessName || 'Sin Nombre'}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono" title={tenant.userId}>
                                                {tenant.userId.substring(0, 12)}...
                                            </span>
                                            {tenant.industry && (
                                                <span className="text-[10px] uppercase tracking-wider text-violet-400 mt-1">
                                                    {tenant.industry}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-xs font-bold px-2 py-1 rounded bg-white/5",
                                                tenant.plan === 'FREE' && "text-gray-400",
                                                tenant.plan === 'GROWTH' && "text-blue-400",
                                                tenant.plan === 'POWER' && "text-violet-400",
                                                tenant.plan === 'CHAIN' && "text-amber-400",
                                                tenant.plan === 'ENTERPRISE' && "text-red-400",
                                            )}>
                                                {tenant.plan}
                                            </span>
                                            <button
                                                onClick={() => setEditingTenant(tenant)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-orange-500/20 rounded text-gray-500 hover:text-orange-500 transition"
                                                title="God Mode Edit"
                                            >
                                                <Zap className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-300">
                                        {tenant.stats.surveys}
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-300">
                                        {tenant.stats.responses}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                        {new Date(tenant.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => router.push(`/admin/tenants/${tenant.userId}`)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                                                title="Ver Detalles"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-500" title="Suspender">
                                                <Shield className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredTenants.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        No se encontraron usuarios
                    </div>
                )}
            </div>

            {/* God Mode Modal */}
            {editingTenant && (
                <GodModeModal
                    isOpen={!!editingTenant}
                    onClose={() => setEditingTenant(null)}
                    tenant={editingTenant}
                />
            )}
        </>
    )
}

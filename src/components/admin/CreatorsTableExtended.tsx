'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Users, Award, ExternalLink, Filter, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { CreatorExtended } from '@/actions/admin' // Interfaces match
import { cn } from '@/lib/utils'

interface CreatorsTableExtendedProps {
    creators: CreatorExtended[]
}

export default function CreatorsTableExtended({ creators }: CreatorsTableExtendedProps) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'sales', direction: 'desc' })
    const [filterStatus, setFilterStatus] = useState<string>('ALL')
    const router = useRouter()

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editRate, setEditRate] = useState<string>('')
    const [isSaving, setIsSaving] = useState(false)

    // Import dynamically to avoid hydration mismatch if simple import
    const { updateCreatorCommission } = require('@/actions/admin')

    const sortedCreators = [...creators].filter(c => {
        if (filterStatus === 'ALL') return true
        return c.status === filterStatus
    }).sort((a, b) => {
        let aValue: number = 0
        let bValue: number = 0

        switch (sortConfig.key) {
            case 'sales':
                aValue = a.stats.totalSalesAmount
                bValue = b.stats.totalSalesAmount
                break
            case 'commission':
                aValue = a.balance
                bValue = b.balance
                break
            case 'referrals':
                aValue = a.stats.activeReferrals
                bValue = b.stats.activeReferrals
                break
            case 'rate':
                aValue = a.commissionRate
                bValue = b.commissionRate
                break
            default:
                return 0
        }

        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
    })

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }))
    }

    const handleRowClick = (userId: string) => {
        if (editingId) return // Don't navigate if editing
        router.push(`/admin/creators/${userId}`)
    }

    const startEdit = (e: React.MouseEvent, creator: CreatorExtended) => {
        e.stopPropagation()
        setEditingId(creator.userId)
        setEditRate(creator.commissionRate.toString())
    }

    const saveEdit = async (e: React.MouseEvent, userId: string) => {
        e.stopPropagation()
        const rate = parseFloat(editRate)
        if (isNaN(rate) || rate < 0 || rate > 100) {
            alert('Por favor ingresa un porcentaje válido (0-100)')
            return
        }

        setIsSaving(true)
        try {
            await updateCreatorCommission(userId, rate)
            // Ideally revalidatePath or router.refresh()
            setEditingId(null)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Error al actualizar')
        } finally {
            setIsSaving(false)
        }
    }

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingId(null)
    }

    return (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-white/10 flex gap-4 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-gray-300 outline-none focus:border-violet-500"
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="ACTIVE">Activos</option>
                        <option value="SUSPENDED">Suspendidos</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSort('sales')}
                        className={cn("px-3 py-1 rounded-lg text-xs font-bold transition", sortConfig.key === 'sales' ? "bg-violet-600 text-white" : "text-gray-400 hover:bg-white/5")}
                    >
                        Top Ventas
                    </button>
                    <button
                        onClick={() => handleSort('commission')}
                        className={cn("px-3 py-1 rounded-lg text-xs font-bold transition", sortConfig.key === 'commission' ? "bg-green-600 text-white" : "text-gray-400 hover:bg-white/5")}
                    >
                        Mayor Deuda
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 font-medium">
                        <tr>
                            <th className="px-6 py-3">Creator / Código</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('rate')}>
                                % Comisión
                            </th>
                            <th className="px-6 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('referrals')}>
                                Referidos Activos
                            </th>
                            <th className="px-6 py-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('sales')}>
                                Ventas Totales ($)
                            </th>
                            <th className="px-6 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('commission')}>
                                Comisión Pendiente
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedCreators.map((creator, index) => (
                            <tr key={creator.id} onClick={() => handleRowClick(creator.userId)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                                            {creator.code.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white tracking-wider">{creator.code}</span>
                                                {index < 3 && sortConfig.key === 'sales' && (
                                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded border border-yellow-500/30">TOP {index + 1}</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono">{creator.userId.substring(0, 10)}...</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {creator.status === 'ACTIVE' ? (
                                        <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Activo
                                        </span>
                                    ) : (
                                        <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Suspendido
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    {editingId === creator.userId ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={editRate}
                                                onChange={(e) => setEditRate(e.target.value)}
                                                className="w-16 bg-black border border-violet-500 rounded px-2 py-1 text-sm outline-none"
                                                autoFocus
                                            />
                                            <button onClick={(e) => saveEdit(e, creator.userId)} disabled={isSaving} className="text-green-500 hover:text-green-400">
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button onClick={cancelEdit} className="text-red-500 hover:text-red-400">
                                                <AlertCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="group/rate flex items-center justify-center gap-2">
                                            <span className="font-mono text-violet-300 font-bold">{creator.commissionRate}%</span>
                                            <button
                                                onClick={(e) => startEdit(e, creator)}
                                                className="opacity-0 group-hover/rate:opacity-100 text-gray-500 hover:text-white transition"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-bold">
                                        <Users className="w-3 h-3" />
                                        {creator.stats.activeReferrals}
                                        <span className="text-gray-500 text-[10px] font-normal">/ {creator.stats.totalReferrals}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-white font-bold tracking-tight">
                                        ${creator.stats.totalSalesAmount.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={cn(
                                        "font-bold",
                                        creator.stats.commissionPending > 0 ? "text-amber-500" : "text-gray-500"
                                    )}>
                                        ${creator.stats.commissionPending.toFixed(2)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sortedCreators.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                    No se encontraron creadores con los filtros actuales.
                </div>
            )}
        </div>
    )
}

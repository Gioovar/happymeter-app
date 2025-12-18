'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusToggle from '@/components/staff/StatusToggle'
import CreatorDetailsModal from '@/components/staff/CreatorDetailsModal'
import { Eye } from 'lucide-react'

interface Creator {
    id: string
    code: string
    paypalEmail: string | null
    niche: string | null
    status: string
    balance: number
    avgRating: number
    reviewCount: number
    totalEarnings?: number
    totalPaid?: number
}

export default function CreatorListTable({ creators }: { creators: Creator[] }) {
    const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const router = useRouter()

    const handleOpenModal = (id: string) => {
        router.push(`/staff/creators/${id}`)
    }

    return (
        <>
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400">
                        <tr>
                            <th className="px-6 py-4">Creador</th>
                            <th className="px-6 py-4">Calif.</th>
                            <th className="px-6 py-4">Ganancias</th>
                            <th className="px-6 py-4">Cobrado</th>
                            <th className="px-6 py-4 text-center">Saldo</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {creators.map(creator => (
                            <tr
                                key={creator.id}
                                className="hover:bg-white/5 transition group cursor-pointer"
                                onClick={() => handleOpenModal(creator.id)}
                            >
                                <td className="px-6 py-4">
                                    <p className="font-bold text-white group-hover:text-violet-400 transition">{creator.code}</p>
                                    <p className="text-xs text-gray-500">{creator.niche || 'General'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <span className="font-bold">{creator.avgRating.toFixed(1)}</span>
                                        <span className="text-xs text-gray-600">({creator.reviewCount})</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                    ${(creator.totalEarnings || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    ${(creator.totalPaid || 0).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="font-bold text-green-400">${creator.balance.toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${creator.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {creator.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(creator.id)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                                            title="Ver Detalles"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <StatusToggle creatorId={creator.id} initialStatus={creator.status} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <CreatorDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                creatorId={selectedCreatorId}
            />
        </>
    )
}

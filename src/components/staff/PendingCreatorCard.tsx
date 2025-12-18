'use client'

import { useState, useTransition } from 'react'
import { approveCreator } from '@/actions/staff'
import { CheckCircle, ExternalLink, MessageCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AffiliateProfile } from '@prisma/client'
import CreatorDetailModal from '@/components/staff/CreatorDetailModal'

export default function PendingCreatorCard({ creator }: { creator: AffiliateProfile }) {
    const [rate, setRate] = useState(30) // Default 30%
    const [isPending, startTransition] = useTransition()
    const [showModal, setShowModal] = useState(false)

    const handleApprove = () => {
        startTransition(async () => {
            try {
                await approveCreator(creator.id, rate)
                toast.success(`Creador aprobado con ${rate}% de comisión`)
            } catch (e) {
                console.error(e)
                toast.error('Error al aprobar')
            }
        })
    }

    return (
        <>
            {showModal && <CreatorDetailModal creator={creator} onClose={() => setShowModal(false)} />}

            <div className="group relative bg-[#0a0a0a] hover:bg-[#111] border border-white/5 rounded-2xl p-3 pr-4 transition-all duration-300 hover:shadow-lg hover:border-yellow-500/20 w-full">
                {/* Status Indicator Stripe */}
                <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-yellow-500" />

                <div className="flex flex-col md:flex-row md:items-center justify-between w-full pl-2 md:pl-5 gap-4">

                    {/* LEFT: Identity & Meta (Flexible) */}
                    <div
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-4 md:gap-6 cursor-pointer flex-1 min-w-0 w-full overflow-hidden"
                    >
                        {/* Identity */}
                        <div className="flex items-center gap-3 shrink-0">
                            <h3 className="font-black text-white text-lg md:text-xl tracking-tight group-hover:text-yellow-400 transition-colors">
                                {creator.code}
                            </h3>
                            <span className="px-2 md:px-3 py-1 bg-yellow-900/20 border border-yellow-700/30 text-yellow-500 text-[10px] md:text-[10px] font-bold tracking-wider uppercase rounded-full">
                                Pendiente
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-6 md:h-8 bg-white/10 shrink-0" />

                        {/* Meta Data */}
                        <div className="flex items-center gap-3 md:gap-4 text-gray-400 text-xs md:text-sm overflow-hidden flex-1">
                            <div className="hidden sm:flex items-center gap-2 shrink-0">
                                <ExternalLink className="w-3 md:w-3.5 h-3 md:h-3.5 text-gray-500" />
                                <span className="font-medium text-gray-300">{creator.niche || '--'}</span>
                            </div>

                            <span className="text-gray-700 shrink-0 hidden sm:block">•</span>

                            <span className="font-mono text-gray-400 shrink-0">{creator.audienceSize || 'N/A'}</span>

                            {/* Divider if strategy exists */}
                            <div className="w-px h-6 md:h-8 bg-white/10 shrink-0 mx-2 hidden sm:block" />

                            <p className="italic text-gray-500 truncate min-w-0 flex-1">
                                "{creator.contentStrategy || '...'}"
                            </p>
                        </div>
                    </div>

                    {/* RIGHT: Actions (Fixed) */}
                    <div className="flex items-center gap-3 md:gap-4 bg-[#111] border border-white/5 p-1.5 pl-3 md:pl-5 rounded-xl shrink-0 w-full md:w-auto justify-between md:justify-start">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Comisión</span>
                            <div className="flex items-center bg-black rounded-lg border border-white/10 overflow-hidden">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={rate}
                                    onChange={(e) => setRate(Number(e.target.value))}
                                    className="w-10 bg-transparent text-white font-bold font-mono text-lg py-1 text-center focus:outline-none"
                                />
                                <span className="text-gray-500 text-xs font-bold pr-2">%</span>
                            </div>
                        </div>

                        <button
                            onClick={handleApprove}
                            disabled={isPending}
                            className="h-10 px-6 bg-green-600 hover:bg-green-500 text-black font-black uppercase tracking-wide text-xs rounded-lg transition-all shadow-lg shadow-green-900/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            <span>Aprobar</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

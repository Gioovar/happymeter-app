'use client'

import { ArrowDownRight, ArrowUpRight, Banknote, Coins, CreditCard, DollarSign } from 'lucide-react'

interface FinancialBreakdownProps {
    data: {
        totalInflow: number
        creatorPayouts: number
        achievementPayouts: number
        staffRevenue: number
    }
}

export default function FinancialBreakdown({ data }: FinancialBreakdownProps) {
    return (
        <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 left-0 p-32 bg-blue-900/10 blur-3xl rounded-full pointer-events-none" />

            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                <Banknote className="w-5 h-5 text-green-400" />
                Flujo de Dinero (Breakdown)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">

                {/* Total Cash In */}
                <div className="bg-[#111] border border-green-500/20 p-4 rounded-2xl group hover:bg-green-500/5 transition">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> IN
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Entradas Totales</p>
                    <p className="text-2xl font-black text-white">${data.totalInflow.toLocaleString()}</p>
                </div>

                {/* Staff Revenue */}
                <div className="bg-[#111] border border-blue-500/20 p-4 rounded-2xl group hover:bg-blue-500/5 transition">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3" /> NET
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pagos a Staff (Agencia)</p>
                    <p className="text-2xl font-black text-white">${data.staffRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-600 mt-1">Estimado (40% del Bruto)</p>
                </div>

                {/* Creator Payouts */}
                <div className="bg-[#111] border border-amber-500/20 p-4 rounded-2xl group hover:bg-amber-500/5 transition">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                            <Coins className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3" /> OUT
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pagos a Creadores</p>
                    <p className="text-2xl font-black text-white">${data.creatorPayouts.toLocaleString()}</p>
                </div>

                {/* Achievement Rewards */}
                <div className="bg-[#111] border border-purple-500/20 p-4 rounded-2xl group hover:bg-purple-500/5 transition">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3" /> OUT
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Pagos por Logros</p>
                    <p className="text-2xl font-black text-white">${data.achievementPayouts.toLocaleString()}</p>
                </div>
            </div>
        </div>
    )
}

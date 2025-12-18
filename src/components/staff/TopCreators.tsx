'use client'

import { Trophy, ArrowUp, Crown } from 'lucide-react'
import Image from 'next/image'

interface CreatorRank {
    id: string
    code: string
    earnings: number
    change: number // percentage
    avatar?: string
}

export default function TopCreators({ creators }: { creators: CreatorRank[] }) {
    const formatMoney = (amount: number) => {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    if (creators.length < 3) return null

    return (
        <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-24 bg-yellow-500/5 blur-3xl rounded-full pointer-events-none" />

            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Hall of Fame
            </h3>

            <div className="flex items-end justify-center gap-4 mt-8">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-400 bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-300 mb-2 shadow-lg shadow-gray-500/20 relative z-10">
                        {creators[1].code.substring(0, 2).toUpperCase()}
                        <div className="absolute -bottom-2 bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">#2</div>
                    </div>
                    <div className="h-24 w-20 bg-gradient-to-t from-gray-800 to-gray-700/50 rounded-t-lg flex flex-col items-center justify-end p-2 border-x border-t border-white/10">
                        <p className="text-xs font-bold text-white mb-1 truncate w-full text-center">{creators[1].code}</p>
                        <p className="text-[10px] text-green-400 font-mono">${formatMoney(creators[1].earnings)}</p>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <Crown className="w-8 h-8 text-yellow-500 absolute -top-8 left-1/2 transform -translate-x-1/2 animate-bounce" />
                        <div className="w-20 h-20 rounded-full border-2 border-yellow-400 bg-yellow-900/50 flex items-center justify-center text-2xl font-bold text-yellow-200 mb-2 shadow-xl shadow-yellow-500/30 relative z-10">
                            {creators[0].code.substring(0, 2).toUpperCase()}
                            <div className="absolute -bottom-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">#1</div>
                        </div>
                    </div>
                    <div className="h-32 w-24 bg-gradient-to-t from-yellow-900/40 to-yellow-600/20 rounded-t-xl flex flex-col items-center justify-end p-3 border-x border-t border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                        <p className="text-sm font-bold text-white mb-1 truncate w-full text-center">{creators[0].code}</p>
                        <p className="text-xs text-green-400 font-bold font-mono">${formatMoney(creators[0].earnings)}</p>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-2 border-orange-700 bg-orange-900/50 flex items-center justify-center text-xl font-bold text-orange-300 mb-2 shadow-lg shadow-orange-700/20 relative z-10">
                        {creators[2].code.substring(0, 2).toUpperCase()}
                        <div className="absolute -bottom-2 bg-orange-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">#3</div>
                    </div>
                    <div className="h-20 w-20 bg-gradient-to-t from-orange-900/30 to-orange-700/20 rounded-t-lg flex flex-col items-center justify-end p-2 border-x border-t border-white/10">
                        <p className="text-xs font-bold text-white mb-1 truncate w-full text-center">{creators[2].code}</p>
                        <p className="text-[10px] text-green-400 font-mono">${formatMoney(creators[2].earnings)}</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-3">
                {creators.slice(3, 6).map((creator, i) => (
                    <div key={creator.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-500">#{i + 4}</span>
                            <span className="font-bold text-sm text-white">{creator.code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-green-400">${formatMoney(creator.earnings)}</span>
                            <span className="flex items-center text-[10px] text-green-500">
                                <ArrowUp className="w-3 h-3" />
                                {creator.change}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

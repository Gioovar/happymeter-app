'use client'

import { Star, Users, TrendingUp } from 'lucide-react'

export default function SocialProof() {
    return (
        <section className="py-10 border-b border-white/5 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">

                    {/* Metric 1 */}
                    <div className="flex items-center justify-center gap-4 py-4 md:py-0">
                        <div className="p-3 rounded-full bg-violet-500/10 text-violet-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl font-bold text-white">10,000+</h3>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Opiniones Procesadas</p>
                        </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="flex items-center justify-center gap-4 py-4 md:py-0">
                        <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-400">
                            <Star className="w-6 h-6 fill-yellow-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl font-bold text-white">4.9/5</h3>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Satisfacción Promedio</p>
                        </div>
                    </div>

                    {/* Metric 3 */}
                    <div className="flex items-center justify-center gap-4 py-4 md:py-0">
                        <div className="p-3 rounded-full bg-green-500/10 text-green-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-2xl font-bold text-white">98%</h3>
                            <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Retención de Clientes</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

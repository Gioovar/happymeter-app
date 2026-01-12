'use client'

import { AlertTriangle, TrendingDown, ShieldAlert } from 'lucide-react'

export default function PainPointSection() {
    return (
        <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
            {/* Background red glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Visual Side */}
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur-lg" />
                        <div className="relative bg-[#111] border border-red-500/20 rounded-2xl p-8 space-y-6">
                            {/* Fake Bad Review */}
                            <div className="flex gap-4 opacity-50 blur-[1px]">
                                <div className="w-10 h-10 rounded-full bg-gray-700" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-32 bg-gray-700 rounded" />
                                    <div className="h-3 w-full bg-gray-700 rounded" />
                                </div>
                            </div>

                            {/* Main Alert Card */}
                            <div className="bg-[#1a0505] border border-red-500/30 p-6 rounded-xl shadow-2xl relative scale-110 -rotate-2">
                                <div className="flex items-center gap-3 mb-3 text-red-500">
                                    <ShieldAlert className="w-6 h-6" />
                                    <span className="font-bold uppercase tracking-wider text-xs">Alerta de Reputación</span>
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">1 Reseña Negativa en Google</h3>
                                <p className="text-gray-400 text-sm mb-4">
                                    "Esperé 40 minutos y la comida llegó fría. No volveré."
                                </p>
                                <div className="h-px w-full bg-red-500/20 mb-4" />
                                <div className="flex items-center gap-3 text-red-400 font-bold">
                                    <TrendingDown className="w-5 h-5" />
                                    <span>-30 Clientes Perdidos</span>
                                </div>
                            </div>

                            {/* Fake Bad Review 2 */}
                            <div className="flex gap-4 opacity-50 blur-[1px]">
                                <div className="w-10 h-10 rounded-full bg-gray-700" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-32 bg-gray-700 rounded" />
                                    <div className="h-3 w-full bg-gray-700 rounded" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Copy Side */}
                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                            Tu negocio pierde dinero <span className="text-red-500">mientras duermes</span>
                        </h2>
                        <p className="text-xl text-gray-400 leading-relaxed">
                            El 96% de tus clientes infelices no te reclaman a ti, <strong>se van con tu competencia</strong>. Dejas ir miles de dólares en mesas vacías, clientes únicos y personal que no rinde.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 mt-1">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg">Ceguera Operativa</h4>
                                    <p className="text-gray-500">No sabes quién roba, quién trata mal al cliente o por qué bajan las ventas.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 mt-1">
                                    <TrendingDown className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg">Reputación en Riesgo</h4>
                                    <p className="text-gray-500">Una sola reseña tóxica en Google te cuesta decenas de clientes nuevos.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <p className="text-white font-medium border-l-4 border-violet-500 pl-4 italic">
                                "HappyMeter es tu escudo. Intercepto la queja, recupero al cliente y te aviso al celular antes de que sea tarde."
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}

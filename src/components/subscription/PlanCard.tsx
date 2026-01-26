'use client'

import { Check, Sparkles, Loader2, Building2, ShieldCheck } from 'lucide-react'

export interface PlanData {
    key: string
    name: string
    price: string
    billingText: string
    description: string
    features: string[]
    cta: string
    popular: boolean
    gradient: string
    border: string
}

interface PlanCardProps {
    plan: PlanData
    interval: 'month' | 'year'
    loading: boolean
    onSelect: () => void
}

export default function PlanCard({ plan, interval, loading, onSelect }: PlanCardProps) {
    return (
        <div className={`relative p-8 rounded-3xl border ${plan.border} bg-black/40 backdrop-blur-xl flex flex-col transition duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/10 h-full`}>
            {/* Launch Offer Badge for Growth */}
            {plan.key === 'GROWTH' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg z-10 whitespace-nowrap border border-white/20">
                    🔥 OFERTA DE LANZAMIENTO
                </div>
            )}

            {plan.popular && plan.key !== 'GROWTH' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-xs font-bold uppercase tracking-wider shadow-lg z-10">
                    Recomendado
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>

                <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    {plan.price !== 'Custom' && plan.price !== '$0' && (
                        <span className="text-gray-400 text-sm">/mes</span>
                    )}
                </div>

                {/* Billing Text Subtitle */}
                <p className="text-xs text-gray-500 mb-2 h-[20px]">{plan.billingText}</p>

                {plan.key === 'GROWTH' ? (
                    <div className="space-y-2 mt-4 min-h-[40px] border-t border-white/5 pt-4">
                        <p className="text-gray-300 text-sm font-medium">
                            🎉 Precio especial por lanzamiento
                        </p>
                        <p className="text-gray-400 text-xs">
                            Aprovecha esta oferta exclusiva. Accede a herramientas premium diseñadas para hacer crecer tu negocio desde el día uno.
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm min-h-[40px] border-t border-white/5 pt-4 mt-2">{plan.description}</p>
                )}
            </div>

            <div className="flex-1 mb-8 space-y-3">
                {plan.features.map((feature: string, fIdx: number) => (
                    <div key={fIdx} className="flex items-start gap-3 text-sm text-gray-300">
                        <div className={`mt-0.5 p-0.5 rounded-full ${plan.popular || plan.key === 'GROWTH' ? 'bg-violet-500/20 text-violet-400' : 'bg-white/10 text-gray-400'}`}>
                            <Check className="w-3 h-3" />
                        </div>
                        {feature}
                    </div>
                ))}
            </div>

            {/* Footer Notes for Growth */}
            {plan.key === 'GROWTH' && (
                <div className="mb-0 pt-4 border-t border-white/5 space-y-2">
                    {/* Moved Real Price here for consistency */}
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 line-through text-sm font-medium">Precio real: $1,200</span>
                        <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/30 font-bold shadow-lg shadow-red-500/10">AHORRAS 70%</span>
                    </div>

                    <p className="flex items-center gap-2 text-[10px] text-gray-400">
                        <Building2 className="w-3 h-3 text-gray-500" />
                        💡 El precio mostrado es por lugar.
                    </p>
                    <p className="flex items-center gap-2 text-[10px] text-gray-400">
                        <ShieldCheck className="w-3 h-3 text-gray-500" />
                        💳 Cobro claro y transparente. Cancela cuando quieras.
                    </p>
                </div>
            )}

            <button
                onClick={onSelect}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 ${plan.popular
                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}>
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <>
                        {plan.cta}
                        {plan.popular && <Sparkles className="w-4 h-4" />}
                    </>
                )}
            </button>
        </div>
    )
}

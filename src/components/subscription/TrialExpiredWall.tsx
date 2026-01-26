'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import PlanCard from './PlanCard'

export default function TrialExpiredWall() {
    const router = useRouter()
    const [interval, setInterval] = useState<'month' | 'year'>('month')
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

    const handleSelectPlan = (planKey: string) => {
        setLoadingPlan(planKey)
        // Redirect to pricing page with checkout intent
        const params = new URLSearchParams()
        params.set('checkout', 'true')
        params.set('plan', planKey)
        params.set('interval', interval)
        router.push(`/pricing?${params.toString()}`)
    }

    const plans = [
        {
            key: 'GROWTH',
            name: 'Growth 1K',
            price: interval === 'month' ? `$450` : `$399`,
            billingText: interval === 'year' ? `Ahorra $51 al mes` : 'Pago mensual',
            description: 'Para negocios individuales que quieren vender más.',
            features: [
                '1 Encuesta Activa',
                '1,000 Respuestas/mes',
                'Contacto Directo (WhatsApp)',
                'Base de Datos Propia',
                'Alertas de Crisis',
                'Sentimiento con IA'
            ],
            cta: 'Elegir Growth',
            popular: true,
            gradient: 'from-violet-600 to-fuchsia-600',
            border: 'border-violet-500'
        },
        {
            key: 'POWER',
            name: 'Power 3X',
            price: interval === 'month' ? `$999` : `$850`,
            billingText: interval === 'year' ? `Ahorra 15%` : 'Pago mensual',
            description: 'Para negocios en expansión y sucursales.',
            features: [
                '3 Encuestas Activas',
                'Respuestas Ilimitadas',
                'Todo lo de Growth',
                'Módulos de Lealtad',
                'Módulos de Procesos',
                'Soporte Prioritario'
            ],
            cta: 'Elegir Power',
            popular: false,
            gradient: 'from-blue-600 to-cyan-600',
            border: 'border-blue-500'
        }
    ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] p-4 overflow-y-auto">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
            </div>

            <div className="max-w-5xl w-full relative z-10 py-10">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl mx-auto flex items-center justify-center mb-6 border border-red-500/20">
                        <Lock className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Acceso Restringido
                    </h2>
                    <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
                        Tu periodo de prueba ha finalizado o tu plan ha expirado. <br />
                        <span className="text-white font-medium">Suscríbete ahora para recuperar el acceso inmediato a tu dashboard.</span>
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <span className={`text-sm font-bold ${interval === 'month' ? 'text-white' : 'text-gray-500'}`}>Mensual</span>
                        <div
                            onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
                            className="w-16 h-8 rounded-full bg-white/10 border border-white/10 p-1 cursor-pointer transition-colors hover:bg-white/20 relative"
                        >
                            <div className={`w-6 h-6 rounded-full bg-violet-500 shadow-lg transform transition-transform duration-300 ${interval === 'year' ? 'translate-x-8' : 'translate-x-0'}`} />
                        </div>
                        <span className={`text-sm font-bold flex items-center gap-2 ${interval === 'year' ? 'text-white' : 'text-gray-500'}`}>
                            Anual
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">-17%</span>
                        </span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <div key={plan.key} className="h-full">
                            <PlanCard
                                plan={plan}
                                interval={interval}
                                loading={loadingPlan === plan.key}
                                onSelect={() => handleSelectPlan(plan.key)}
                            />
                        </div>
                    ))}
                </div>

                <p className="mt-10 text-center text-xs text-gray-500">
                    ¿Necesitas ayuda o crees que es un error? <span className="text-gray-400 underline cursor-pointer" onClick={() => window.open('https://wa.me/5211234567890')}>Contactar Soporte</span>
                </p>
            </div>
        </div>
    )
}


